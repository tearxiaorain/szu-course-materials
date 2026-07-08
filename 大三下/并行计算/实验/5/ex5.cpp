#include <iostream>
#include <pthread.h>
using namespace std;
const int MAX = 100;
int p = 8;
int n = 1e6;
int a[MAX];
int num = 0;
typedef struct { int* data; int count; } result_t;
pthread_mutex_t mutex;

void* Perfect_number(void* r) {
	int my_rank = (long)r;

    for (int my_i = my_rank + 1; my_i <= n; my_i += p)
    {
        if(my_i < 2)
            continue;

        int sum = 0;
        for(int i = 1; i * i <= my_i; i++)
        {
            if(my_i % i == 0)
            {
                sum += i;
                if(i * i != my_i && i != 1)
                    sum += my_i / i;
            }
            if(sum > my_i)
                 break;
        }
        
        if(sum == my_i)
        {
            pthread_mutex_lock(&mutex);
            a[num++] = my_i;
            pthread_mutex_unlock(&mutex);
        }
    }
    
    return NULL;
}
int main(void) {
	if (argc > 1)
        p = atoi(argv[1]);
    if (argc > 2)
        n = atoi(argv[2]);
    
    long thread;
    pthread_t* thread_handles;
    thread_handles = (pthread_t*)malloc(p * sizeof(pthread_t));
    pthread_mutex_init(&mutex, NULL);
    
    struct timespec start, finish;
	timespec_get(&start, TIME_UTC);
    
    for (thread = 0; thread < p; thread++)
    {
        pthread_create(&thread_handles[thread], NULL, Perfect_number, (void*)thread);
    } 

    for (thread = 0; thread < p; thread++)
    {
        pthread_join(thread_handles[thread], NULL);
    }

	timespec_get(&finish, TIME_UTC);
	cout << "parallel execution time = " << finish.tv_sec - start.tv_sec + (finish.tv_nsec - start.tv_nsec) / 1e9 << endl;
	for (int i = 0; i < num; i++)
		cout << a[i] << " ";
	cout << endl;
	return 0;
}
