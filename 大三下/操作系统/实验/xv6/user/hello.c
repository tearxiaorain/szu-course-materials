#include "kernel/types.h"
#include "user/user.h"

int main(void) {
    printf("Hello world from xv6!\n");
    hello();
    exit(0);
}
