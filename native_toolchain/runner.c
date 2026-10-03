#include <dlfcn.h>
#include <stdio.h>
#include <stdlib.h>
int main(int argc, char **argv) {
    if (argc != 2) return 64;
    void *module = dlopen(argv[1], RTLD_NOW | RTLD_LOCAL);
    if (!module) { fprintf(stderr,"Loader: %s\n",dlerror()); return 70; }
    int (*entry)(int,char**) = (int (*)(int,char**)) dlsym(module,"main");
    if (!entry) { fprintf(stderr,"Missing main: %s\n",dlerror()); return 70; }
    char *args[] = {argv[1], NULL};
    int result = entry(1,args);
    fflush(NULL);
    /* Exit runs static C++ destructors and atexit handlers. */
    exit(result);
}
