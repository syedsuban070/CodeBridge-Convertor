/* Checked arena only: not a general-purpose heap sanitizer. */
#include <stdio.h>
#include <stdlib.h>
typedef int cb_handle;
static int cb_data[32][64],cb_size[32],cb_live[32],cb_generation[32],cb_error,cb_allocations;
static void cb_problem(const char *message){fprintf(stderr,"Memory Lab: %s\n",message);cb_error=1;}
static cb_handle cb_alloc(int n){
 if(n<1||n>64){cb_problem("allocation must be 1..64 integers");return -1;}
 for(int i=0;i<32;i++)if(!cb_live[i]){cb_live[i]=1;cb_size[i]=n;cb_allocations++;cb_generation[i]++;return cb_generation[i]*32+i;}
 cb_problem("arena full");return -1;
}
static int cb_valid(cb_handle h,int index){
 if(h<0){cb_problem("invalid handle");return 0;}
 int slot=h%32;
 if(!cb_live[slot]||h/32!=cb_generation[slot]){cb_problem("invalid or freed handle");return 0;}
 if(index<0||index>=cb_size[slot]){cb_problem("out-of-bounds access");return 0;}
 return 1;
}
static void cb_set(cb_handle h,int index,int value){if(cb_valid(h,index))cb_data[h%32][index]=value;}
static int cb_get(cb_handle h,int index){return cb_valid(h,index)?cb_data[h%32][index]:0;}
static void cb_free(cb_handle h){if(cb_valid(h,0))cb_live[h%32]=0;}
static int cb_check(void){
 if(!cb_allocations)cb_problem("challenge requires an arena allocation");
 for(int i=0;i<32;i++)if(cb_live[i]){cb_problem("unreleased arena allocation");break;}
 return cb_error?86:0;
}
