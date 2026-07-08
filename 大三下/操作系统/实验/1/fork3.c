#include <unistd.h>
#include <stdio.h>
int main()
{
    for(int i = 0; i < 3; i++)
    {
        int left = fork();
        if(left > 0)
        {
            int right = fork();
            if(right > 0)
            {
                break;
            }
            
        }
    }
    int a = 0;
    while (1)
    {
        a++;
    }
}
