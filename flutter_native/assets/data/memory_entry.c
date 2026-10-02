int main(void){int n=0;if(scanf("%d",&n)!=1)return 64;int result=solve(n);int status=cb_check();if(status)return status;printf("%d\n",result);return 0;}
