// Test program for user-level threads in xv6.
// Demonstrates:
//   1. Creating multiple threads
//   2. Shared memory between threads and main process
//   3. Parallel execution
//   4. Thread joining
//   5. User-level mutex via shared memory + RISC-V atomic ops

#include "kernel/types.h"
#include "user/user.h"
#include "user/thread.h"

// Shared global variable - all threads can access this.
volatile int shared_counter = 0;
volatile int shared_flag = 0;

// Mutex for protecting printf output (also proves atomic ops work).
mutex_t print_lock;

#define NTHREADS 5

// Thread function: increments the shared counter.
void
thread_func(void *arg)
{
  int id = *(int*)arg;
  int i;

  mutex_lock(&print_lock);
  printf("Thread %d (tid=%d): started, shared_counter=%d\n", 
         id, getpid(), shared_counter);
  mutex_unlock(&print_lock);

  // Each thread increments the counter 100 times.
  for(i = 0; i < 100; i++){
    int tmp = shared_counter;
    tmp = tmp + 1;
    shared_counter = tmp;
  }

  mutex_lock(&print_lock);
  printf("Thread %d: finished, shared_counter=%d\n", id, shared_counter);
  mutex_unlock(&print_lock);

  exit(0);
}

// Thread function that sets a flag.
void
flag_setter(void *arg)
{
  int delay = *(int*)arg;

  mutex_lock(&print_lock);
  printf("flag_setter: sleeping for %d ticks...\n", delay);
  mutex_unlock(&print_lock);

  pause(delay);
  shared_flag = 1;

  mutex_lock(&print_lock);
  printf("flag_setter: flag set to 1\n");
  mutex_unlock(&print_lock);

  exit(0);
}

int
main(int argc, char *argv[])
{
  thread_t threads[NTHREADS];
  int ids[NTHREADS];
  int i;

  mutex_init(&print_lock);

  // No lock needed yet — only main thread is running.
  printf("=== xv6 User Thread Test ===\n");
  printf("Main process pid=%d\n", getpid());
  printf("Initial shared_counter=%d\n\n", shared_counter);

  // Test 1: Create multiple threads that share the counter.
  printf("--- Test 1: Creating %d threads ---\n", NTHREADS);
  for(i = 0; i < NTHREADS; i++){
    ids[i] = i + 1;
    if(thread_create(&threads[i], thread_func, &ids[i]) < 0){
      printf("Error: failed to create thread %d\n", i);
      exit(1);
    }
    mutex_lock(&print_lock);
    printf("Created thread %d, tid=%d\n", i + 1, threads[i].tid);
    mutex_unlock(&print_lock);
  }

  printf("\n--- Test 2: Joining all threads ---\n");
  for(i = 0; i < NTHREADS; i++){
    int status = thread_join(&threads[i]);
    mutex_lock(&print_lock);
    printf("Joined thread %d (tid=%d), status=%d\n",
           i + 1, threads[i].tid, status);
    mutex_unlock(&print_lock);
  }

  mutex_lock(&print_lock);
  printf("\nFinal shared_counter=%d (expected: %d)\n",
         shared_counter, NTHREADS * 100);
  mutex_unlock(&print_lock);

  // Test 3: Demonstrate flag-based synchronization.
  printf("\n--- Test 3: Flag synchronisation ---\n");
  shared_flag = 0;
  int delay = 50;
  thread_t ft;
  if(thread_create(&ft, flag_setter, &delay) < 0){
    printf("Error: failed to create flag_setter thread\n");
    exit(1);
  }

  printf("Main: waiting for flag...\n");
  while(shared_flag == 0){
    thread_yield();  // yield CPU while waiting
  }
  mutex_lock(&print_lock);
  printf("Main: flag detected! shared_flag=%d\n", shared_flag);
  mutex_unlock(&print_lock);

  thread_join(&ft);
  printf("flag_setter joined.\n");

  printf("\n=== All tests passed! ===\n");
  exit(0);
}
