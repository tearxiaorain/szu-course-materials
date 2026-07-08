#include "types.h"
#include "param.h"
#include "memlayout.h"
#include "riscv.h"
#include "spinlock.h"
#include "defs.h"

struct semaphore {
  struct spinlock lock;
  int used;
  int value;
};

static struct semaphore sems[NSEM];

void
seminit(void)
{
  for(int i = 0; i < NSEM; i++) {
    initlock(&sems[i].lock, "sem");
    sems[i].used = 0;
    sems[i].value = 0;
  }
}

int
sem_init(int id, int value)
{
  if(id < 0 || id >= NSEM)
    return -1;
  if(value < 0)
    return -1;

  struct semaphore *s = &sems[id];
  acquire(&s->lock);
  if(s->used) {
    release(&s->lock);
    return -1;
  }
  s->used = 1;
  s->value = value;
  release(&s->lock);
  return 0;
}

int
sem_wait(int id)
{
  if(id < 0 || id >= NSEM)
    return -1;

  struct semaphore *s = &sems[id];
  acquire(&s->lock);
  if(!s->used) {
    release(&s->lock);
    return -1;
  }
  while(s->value == 0) {
    sleep(s, &s->lock);
    if(!s->used) {
      release(&s->lock);
      return -1;
    }
  }
  s->value--;
  release(&s->lock);
  return 0;
}

int
sem_post(int id)
{
  if(id < 0 || id >= NSEM)
    return -1;

  struct semaphore *s = &sems[id];
  acquire(&s->lock);
  if(!s->used) {
    release(&s->lock);
    return -1;
  }
  s->value++;
  wakeup(s);
  release(&s->lock);
  return 0;
}

int
sem_destroy(int id)
{
  if(id < 0 || id >= NSEM)
    return -1;

  struct semaphore *s = &sems[id];
  acquire(&s->lock);
  if(!s->used) {
    release(&s->lock);
    return -1;
  }
  s->used = 0;
  s->value = 0;
  wakeup(s);
  release(&s->lock);
  return 0;
}
