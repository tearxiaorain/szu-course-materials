#include "types.h"
#include "param.h"
#include "memlayout.h"
#include "riscv.h"
#include "spinlock.h"
#include "defs.h"

#define NCLASS 8

struct slab_obj {
  struct slab_obj *next;
  uint8 class;
};

struct slab_cache {
  int obj_size;
  struct slab_obj *free;
};

static struct spinlock slab_lock;
static struct slab_cache caches[NCLASS];
static void *slab_pages[SLAB_PAGES];
static int slab_page_used[SLAB_PAGES];

static int
class_for_size(int size)
{
  int sizes[NCLASS] = {16, 32, 64, 128, 256, 512, 1024, 2048};
  int need = size + sizeof(struct slab_obj);

  for(int i = 0; i < NCLASS; i++) {
    if(need <= sizes[i])
      return i;
  }
  return -1;
}

static void
slab_grow(int c)
{
  int sizes[NCLASS] = {16, 32, 64, 128, 256, 512, 1024, 2048};
  void *page = 0;

  for(int i = 0; i < SLAB_PAGES; i++) {
    if(!slab_page_used[i]) {
      slab_page_used[i] = 1;
      page = slab_pages[i];
      break;
    }
  }

  if(page == 0)
    return;

  int obj_size = sizes[c];
  int count = PGSIZE / obj_size;
  char *p = (char *)page;

  for(int i = 0; i < count; i++) {
    struct slab_obj *obj = (struct slab_obj *)(p + i * obj_size);
    obj->class = (uint8)c;
    obj->next = caches[c].free;
    caches[c].free = obj;
  }
}

void
slabinit(void)
{
  initlock(&slab_lock, "slab");

  int sizes[NCLASS] = {16, 32, 64, 128, 256, 512, 1024, 2048};
  for(int i = 0; i < NCLASS; i++) {
    caches[i].obj_size = sizes[i];
    caches[i].free = 0;
  }

  for(int i = 0; i < SLAB_PAGES; i++) {
    slab_pages[i] = kalloc();
    slab_page_used[i] = 0;
  }
}

void *
slab_alloc(int size)
{
  int c = class_for_size(size);
  if(c < 0)
    return 0;

  acquire(&slab_lock);
  if(caches[c].free == 0)
    slab_grow(c);
  if(caches[c].free == 0) {
    release(&slab_lock);
    return 0;
  }

  struct slab_obj *obj = caches[c].free;
  caches[c].free = obj->next;
  release(&slab_lock);

  return (void *)(obj + 1);
}

int
slab_free(void *p)
{
  if(p == 0)
    return -1;

  struct slab_obj *obj = ((struct slab_obj *)p) - 1;
  int c = obj->class;
  if(c < 0 || c >= NCLASS)
    return -1;

  acquire(&slab_lock);
  obj->next = caches[c].free;
  caches[c].free = obj;
  release(&slab_lock);
  return 0;
}
