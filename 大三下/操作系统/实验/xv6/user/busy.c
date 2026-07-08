#include "kernel/types.h"
#include "user/user.h"

int main(int argc, char *argv[])
{
    if(argc > 1) {
        int prio = atoi(argv[1]);
        setpriority(prio);
    }

    while(1) {
        // busy loop
    }

    exit(0);
}