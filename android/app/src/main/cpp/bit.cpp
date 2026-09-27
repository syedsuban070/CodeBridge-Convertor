#include <jni.h>
#include <atomic>
#include <chrono>
#include <memory>
#include <string>
#include <vector>
#include <algorithm>
#include <thread>
#include <stdexcept>
#include <mutex>
#include "llama.h"
static std::atomic<bool> cancelled(false);
static std::once_flag backend;
static std::chrono::steady_clock::time_point deadline;
static bool abort_decode(void*) { return cancelled.load() || std::chrono::steady_clock::now()>deadline; }
extern "C" JNIEXPORT void JNICALL Java_com_codebridge_mobile_BitBridge_cancelNative(JNIEnv*, jclass) { cancelled.store(true); }
extern "C" JNIEXPORT void JNICALL Java_com_codebridge_mobile_BitBridge_resetNative(JNIEnv*, jclass) { cancelled.store(false); }
// Return raw UTF-8 bytes: JNI NewStringUTF uses modified UTF-8 and is unsuitable for model text.
extern "C" JNIEXPORT jbyteArray JNICALL Java_com_codebridge_mobile_BitBridge_generateNative(JNIEnv* env,jclass,jstring jpath,jbyteArray jprompt,jint requested) {
    std::string result;
    const char* pathBytes=env->GetStringUTFChars(jpath,nullptr);std::string path(pathBytes);env->ReleaseStringUTFChars(jpath,pathBytes);
    std::string prompt(env->GetArrayLength(jprompt),'\0');env->GetByteArrayRegion(jprompt,0,prompt.size(),reinterpret_cast<jbyte*>(prompt.data()));
    deadline=std::chrono::steady_clock::now()+std::chrono::seconds(180);
    try {
        std::call_once(backend, []{llama_backend_init();});
        auto mp=llama_model_default_params();mp.n_gpu_layers=0;mp.use_mmap=true;
        mp.progress_callback=[](float,void*) {return !abort_decode(nullptr);};
        std::unique_ptr<llama_model,decltype(&llama_model_free)> model(llama_model_load_from_file(path.c_str(),mp),llama_model_free);
        if(!model)throw std::runtime_error("Model could not load. Free memory and retry.");
        if(abort_decode(nullptr))throw std::runtime_error("Cancelled or timed out.");
        const auto* vocab=llama_model_get_vocab(model.get());
        int count=-llama_tokenize(vocab,prompt.data(),prompt.size(),nullptr,0,true,true);
        if(count<=0||count>1536)throw std::runtime_error("This request is too large. Select a smaller part of your code.");
        std::vector<llama_token> tokens(count);llama_tokenize(vocab,prompt.data(),prompt.size(),tokens.data(),count,true,true);
        auto cp=llama_context_default_params();cp.n_ctx=2048;cp.n_batch=1536;cp.n_ubatch=128;cp.n_threads=std::max(1u,std::min(4u,std::thread::hardware_concurrency()));cp.n_threads_batch=cp.n_threads;cp.abort_callback=abort_decode;
        std::unique_ptr<llama_context,decltype(&llama_free)> ctx(llama_init_from_model(model.get(),cp),llama_free);
        if(!ctx)throw std::runtime_error("Not enough memory for the AI context.");
        std::unique_ptr<llama_sampler,decltype(&llama_sampler_free)> sampler(llama_sampler_init_greedy(),llama_sampler_free);
        auto batch=llama_batch_get_one(tokens.data(),tokens.size());llama_token next=0;
        int limit=std::clamp((int)requested,16,256);
        for(int i=0;i<limit;i++) {
            if(abort_decode(nullptr))throw std::runtime_error("Cancelled or timed out.");
            if(llama_decode(ctx.get(),batch))throw std::runtime_error("Inference interrupted. Try a shorter request.");
            next=llama_sampler_sample(sampler.get(),ctx.get(),-1);
            if(llama_vocab_is_eog(vocab,next))break;
            char piece[256];int n=llama_token_to_piece(vocab,next,piece,sizeof(piece),0,true);
            if(n<0){std::vector<char> large(-n);n=llama_token_to_piece(vocab,next,large.data(),large.size(),0,true);if(n>0)result.append(large.data(),n);}else result.append(piece,n);
            batch=llama_batch_get_one(&next,1);
        }
        if(result.empty())result="The model returned no text. Try a specific question about one error.";
    } catch(const std::exception& error){result=std::string("ERROR: ")+error.what();}
    jbyteArray bytes=env->NewByteArray(result.size());if(bytes)env->SetByteArrayRegion(bytes,0,result.size(),reinterpret_cast<const jbyte*>(result.data()));return bytes;
}
