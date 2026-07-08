#include <unistd.h>
#include <stdio.h>
int main()
{
    int pid = 0;
    for (int i = 0; i < 10; i++)
    {
        if (pid == 0)
        {
            pid = fork();
        }
    }
    int a = 0;
    while (1)
    {
        a++;
    }
}
