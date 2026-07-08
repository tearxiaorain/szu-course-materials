#include <iostream>
#include <pthread.h>
using namespace std;
int p = 8;
int n = 2e8;
double* a;
double* b;
double* c;

pthread_mutex_t mutex;
pthread_cond_t cond;
double* my_sum;
double* offset;
int count = 0;

void* Prefix_sum(void* r) {
	long my_rank = (long)r;
    long long my_n = n/p;
    long long my_first = my_rank * my_n;
    long long my_last = my_first + my_n;
    double sum = 0;
    for (long long i = my_first; i < my_last; i++)
    {
        b[i] = sum + a[i];
        sum = b[i];
    }
    my_sum[my_rank] = sum;

    pthread_mutex_lock(&mutex);
    while (my_rank != count) 
    {
        pthread_cond_wait(&cond, &mutex);
    }
    offset[my_rank] = (my_rank == 0) ? 0 : offset[my_rank - 1] + my_sum[my_rank - 1];
    count++;
    pthread_cond_broadcast(&cond);
    pthread_mutex_unlock(&mutex);

    for (long long i = my_first; i < my_last; i++)
    {
        b[i] = b[i] + offset[my_rank];
    }

    return NULL;
}
static uint64_t seed = 1;
inline double fast_rand() {
	seed = seed * 6364136223846793005ULL + 1;
	return (double)(seed >> 32) / (1ULL << 32);
}
int main(void) {
	a = new double[n];
	b = new double[n];
	c = new double[n];
	for (int i = 0; i < n; i++)
		a[i] = fast_rand() * 2 - 1;
	struct timespec start, finish;
	
    if (argc > 1)
        p = atoi(argv[1]);
    if (argc > 2)
        n = atoi(argv[2]);
    count = 0;
    my_sum = new double[p];
    offset = new double[p];
    long thread;
    pthread_t* thread_handles;
    thread_handles = (pthread_t*)malloc(p * sizeof(pthread_t));
    pthread_mutex_init(&mutex, NULL);
    pthread_cond_init(&cond, NULL);

    timespec_get(&start, TIME_UTC);

    for (thread = 0; thread < p; thread++)
    {
        pthread_create(&thread_handles[thread], NULL, Prefix_sum, (void*)thread);
    }  
    for (thread = 0; thread < p; thread++)
    {
        pthread_join(thread_handles[thread], NULL);
    }

	timespec_get(&finish, TIME_UTC);
	cout << "parallel execution time = " << finish.tv_sec - start.tv_sec + (finish.tv_nsec - start.tv_nsec) / 1e9 << endl;
	timespec_get(&start, TIME_UTC);
	c[0] = a[0];
	for (int i = 1; i < n; i++)
		c[i] = c[i - 1] + a[i];
	timespec_get(&finish, TIME_UTC);
	cout << "serial execution time = " << finish.tv_sec - start.tv_sec + (finish.tv_nsec - start.tv_nsec) / 1e9 << endl;
	double error = 0;
	for (int i = 0; i < n; i++)
		if (abs(b[i] - c[i]) > error)
			error = abs(b[i] - c[i]);
	cout << "max error = " << error << endl;
	delete[] a;
	delete[] c;
	return 0;
}
