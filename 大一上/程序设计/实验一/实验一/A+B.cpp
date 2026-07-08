#include<stdio.h>
void solve() {
	double x;
	scanf("%lf", &x);
	if(x >= 85) {
		puts("A");
	} else if(x >= 75) {
		puts("B");
	} else if(x >= 65) {
		puts("C");
	} else if(x >= 60) {
		puts("D");
	} else {
		puts("F");
	}
}
int main() {
	int T;
	scanf("%d", &T);
	while(T--) solve();
	return 0;
}

