#include <stdio.h>
#include <stdlib.h>
#include <pthread.h>

#define NL00P 5000

int counter; /*incremented by threads*/

void *increase(void *vptr);

int main(int argc, char **argv)
{
    pthread_t threadIdA, threadIdB;

    pthread_create(&threadIdA, NULL, &increase, NULL);
    pthread_create(&threadIdB, NULL, &increase, NULL);

    /*wait for both threads to terminate*/
    pthread_join(threadIdA, NULL);
    pthread_join(threadIdB, NULL);
    return 0;
}
void *increase(void *vptr)
{
    int i, val;

    for (i = 0; i < NL00P; i++)
    {
        val = counter;
        printf("%x: %d\n", (unsigned int)pthread_self(), val + 1);
        counter = val + 1;
    }
    return NULL;
}
