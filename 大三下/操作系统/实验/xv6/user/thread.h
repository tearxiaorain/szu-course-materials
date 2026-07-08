// User-level thread library for xv6.
// Provides a simple interface for creating and joining threads.
// Note: include "user/user.h" before this header.

#ifndef _THREAD_H_
#define _THREAD_H_

// Forward declarations from user.h (needed by inline functions below).
int getpid(void);
int pause(int);

// Thread descriptor
typedef struct {
  int tid;             // thread ID
  void *stack;         // pointer to thread's stack
  int stack_size;      // size of the stack
  int joined;          // whether the thread has been joined
} thread_t;

// Create a new thread that runs fcn(arg).
// Returns 0 on success, -1 on error.
int thread_create(thread_t *thread, void (*fcn)(void*), void *arg);

// Wait for a thread to finish.
// Returns the thread's exit status, or -1 on error.
int thread_join(thread_t *thread);

// Get current thread ID (same as getpid for now).
static inline int thread_self(void) {
  return getpid();
}

// Yield the CPU to another thread/process.
static inline void thread_yield(void) {
  pause(1);
}

// ─── User-level mutex using RISC-V atomic instructions ───
// Demonstrates that threads can synchronise via shared memory.
typedef volatile int mutex_t;

// Atomic swap: atomically swaps *addr with newval, returns old value.
// Uses RISC-V amoswap.w with acquire semantics.
static inline int
_atomic_swap(volatile int *addr, int newval)
{
  int old;
  __asm__ __volatile__(
      "amoswap.w.aq %0, %2, (%1)"
      : "=r"(old)
      : "r"(addr), "r"(newval)
      : "memory");
  return old;
}

// Initialise mutex (0 = unlocked, 1 = locked).
static inline void
mutex_init(mutex_t *m)
{
  *m = 0;
}

// Acquire the mutex; spins (with yield) until available.
static inline void
mutex_lock(mutex_t *m)
{
  while(_atomic_swap(m, 1)){
    thread_yield();
  }
}

// Release the mutex.
static inline void
mutex_unlock(mutex_t *m)
{
  *m = 0;
}

#endif // _THREAD_H_
