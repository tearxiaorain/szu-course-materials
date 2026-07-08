#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <sys/types.h>
#include <sys/wait.h>

int main(int argc, char *argv[])
{
    pid_t pid1, pid2;
    pid1 = pid2 = -1;
    int depth = atoi(argv[1]);
    int i;
    int numb = 1;
    int my_level = 0;

    for (i = 0; i < depth; i++)
    {
        if (my_level == i)
        {
            printf("I am process no %5d with PID %5d and PPID %d\n",
                   numb, getpid(), getppid());
            switch (pid1 = fork())
            {
            case 0:
                numb = 2 * numb;
                my_level=i+1;
                break;
            case -1:
                perror("fork");
                exit(1);
            default:
                switch (pid2 = fork())
                {
                case 0:
                    numb = 2 * numb + 1;
                    my_level=i+1;
                    break;
                case -1:
                    perror("fork");
                    exit(1);
                default:
                    waitpid(pid1, NULL, 0);
                    waitpid(pid2, NULL, 0);
                    break;
                }
            }
        }
    }
}
