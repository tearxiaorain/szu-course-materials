// User-level thread library for xv6.
// Implements thread_create() and thread_join() using clone() and join().

#include "kernel/types.h"
#include "user/user.h"
#include "user/thread.h"

#define THREAD_STACK_SIZE 4096  // 4KB stack per thread

// Structure passed to the thread wrapper.
struct thread_arg {
  void (*fcn)(void*);
  void *arg;
};

// Wrapper function that calls the user's thread function,
// then calls exit() when the function returns.
static void
thread_wrapper(void *a)
{
  struct thread_arg *ta = (struct thread_arg *)a;
  ta->fcn(ta->arg);
  // If the thread function returns, exit the thread.
  exit(0);
}

// Create a new thread.
// Allocates a stack, sets up the thread descriptor, and calls clone().
int
thread_create(thread_t *thread, void (*fcn)(void*), void *arg)
{
  // Allocate a stack for the new thread.
  char *stack = (char *)malloc(THREAD_STACK_SIZE);
  if(stack == 0)
    return -1;

  // Place thread_arg at the top of the stack.
  struct thread_arg *ta = (struct thread_arg *)(stack + THREAD_STACK_SIZE - sizeof(struct thread_arg));
  ta->fcn = fcn;
  ta->arg = arg;

  // The stack pointer for the new thread: below the thread_arg struct.
  void *sp = (void *)ta;

  // Create the thread via clone().
  int tid = clone(thread_wrapper, (void *)ta, sp);
  if(tid < 0){
    free(stack);
    return -1;
  }

  thread->tid = tid;
  thread->stack = stack;
  thread->stack_size = THREAD_STACK_SIZE;
  thread->joined = 0;

  return 0;
}

// Wait for a thread to finish and free its resources.
int
thread_join(thread_t *thread)
{
  if(thread->joined)
    return -1;

  int status = join(thread->tid);
  if(status < 0)
    return -1;

  thread->joined = 1;
  free(thread->stack);
  thread->stack = 0;

  return status;
}
