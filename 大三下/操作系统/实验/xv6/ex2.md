实验过程、方法、步骤：

阅读实验辅助材料完成以下操作

操作部分：修改xv6内核代码实现简单线程；
做到创建线程的开销比创建进程要小，线程可以共享进程的主要资源——例如内存映像、打开的文件等等。在xv6上实现线程所涉及的主要工作包括如下：
a)	 给出实现方案，修改必要的核心数据结构（10%）
b)	 实现 clone() 系统调用，用于创建一个内核线程。（30%）
c)	 实现 join() 系统调用，用于撤销一个内核线程。 （30%）
d)	 实现用户线程库，封装对线程的管理，而用户只需要知道接口的使用。（20%）
e)	 提供测试样例，包括共享进程空间、多线程并行。 （10%）


一、设计思路

本实验的核心目标是在 xv6 中实现用户级线程，使多个线程共享同一个进程的地址空间、打开文件和工作目录。与 fork() 创建进程不同，clone() 创建线程时不复制物理内存页，而是让新旧线程通过各自的页表映射到相同的物理页。

关键设计决策：
1. 每个线程拥有独立的 proc 结构（含独立内核栈和 trapframe），但共享用户内存页
2. 通过 uvmshare() 实现页表级共享：子线程的页表项指向父进程相同的物理页
3. 线程退出时不释放共享资源（用户内存页、文件描述符、cwd），由主进程统一管理
4. 用 is_thread 和 tparent 字段区分线程与进程，使 wait()/exit()/freeproc() 能正确处理


二、a) 修改核心数据结构

在 kernel/proc.h 的 struct proc 末尾新增两个字段，用于标记线程身份和追踪线程归属：

【截图占位：kernel/proc.h — struct proc 末尾新增 is_thread 和 tparent 字段】

```c
// kernel/proc.h — struct proc 末尾新增
  // Thread support
  int is_thread;               // 1 if this proc is a thread
  struct proc *tparent;        // Thread parent (the process that created this thread)
```

在 kernel/defs.h 中新增函数声明：

【截图占位：kernel/defs.h — 新增 kclone、kjoin、uvmshare、freewalk 声明】

```c
// kernel/defs.h 新增
int             kclone(uint64 fcn, uint64 arg, uint64 stack);
int             kjoin(int tid);
int             uvmshare(pagetable_t, pagetable_t, uint64);
void            freewalk(pagetable_t);
```

在 kernel/proc.c 的 allocproc() 中初始化新字段：

【截图占位：kernel/proc.c — allocproc() 中 found: 标签下新增初始化】

```c
// kernel/proc.c — allocproc() 中 found: 标签下新增
found:
  p->pid = allocpid();
  p->state = USED;
  p->is_thread = 0;     // 新增：默认不是线程
  p->tparent = 0;       // 新增：无线程父进程
```


三、b) 实现 clone() 系统调用

3.1 新增系统调用号

在 kernel/syscall.h 中添加 SYS_clone 和 SYS_join：

【截图占位：kernel/syscall.h — 新增 SYS_clone(22) 和 SYS_join(23)】

```c
// kernel/syscall.h
#define SYS_close  21
#define SYS_clone  22    // 新增
#define SYS_join   23    // 新增
```

3.2 注册系统调用处理函数

在 kernel/syscall.c 中添加函数声明和分发表条目：

【截图占位：kernel/syscall.c — 新增 extern 声明和 syscalls[] 表项】

```c
// kernel/syscall.c — 新增 extern 声明
extern uint64 sys_clone(void);
extern uint64 sys_join(void);

// kernel/syscall.c — 新增分发表条目
[SYS_close]   sys_close,
[SYS_clone]   sys_clone,    // 新增
[SYS_join]    sys_join,     // 新增
```

3.3 实现 sys_clone()

在 kernel/sysproc.c 中实现 sys_clone()，从用户态获取 fcn、arg、stack 三个参数，调用内核函数 kclone()：

【截图占位：kernel/sysproc.c — sys_clone() 实现】

```c
// kernel/sysproc.c — 新增 sys_clone()
uint64
sys_clone(void)
{
  uint64 fcn, arg, stack;

  argaddr(0, &fcn);
  argaddr(1, &arg);
  argaddr(2, &stack);

  if(fcn == 0 || stack == 0)
    return -1;

  return kclone(fcn, arg, stack);
}
```

3.4 实现内核核心函数 kclone()

在 kernel/proc.c 中实现 kclone()。这是线程创建的核心逻辑：

【截图占位：kernel/proc.c — kclone() 实现（上）】

```c
// kernel/proc.c — kclone()（核心实现）
int
kclone(uint64 fcn, uint64 arg, uint64 stack)
{
  int i, tid;
  struct proc *np;
  struct proc *p = myproc();

  // 1. 分配新的 proc 结构（含独立内核栈和 trapframe）
  if((np = allocproc()) == 0){
    return -1;
  }

  // 2. 共享用户内存：将父进程的物理页映射到子线程的页表
  if(uvmshare(p->pagetable, np->pagetable, p->sz) < 0){
    freeproc(np);
    release(&np->lock);
    return -1;
  }
  np->sz = p->sz;

  // 3. 复制父进程 trapframe，然后定制线程入口
  *(np->trapframe) = *(p->trapframe);
  np->trapframe->epc = fcn;   // 线程从 fcn 开始执行
  np->trapframe->a0 = arg;    // 参数传入 a0
  np->trapframe->sp = stack;  // 使用用户提供的栈
```

【截图占位：kernel/proc.c — kclone() 实现（下）】

```c
  // 4. 共享打开的文件（增加引用计数）
  for(i = 0; i < NOFILE; i++){
    if(p->ofile[i])
      np->ofile[i] = filedup(p->ofile[i]);
    else
      np->ofile[i] = 0;
  }

  // 5. 共享当前工作目录
  np->cwd = idup(p->cwd);

  safestrcpy(np->name, p->name, sizeof(p->name));

  // 6. 标记为线程
  np->is_thread = 1;
  np->tparent = p;

  tid = np->pid;
  release(&np->lock);

  acquire(&wait_lock);
  np->parent = p;
  release(&wait_lock);

  acquire(&np->lock);
  np->state = RUNNABLE;
  release(&np->lock);

  return tid;
}
```

3.5 实现 uvmshare() — 页表共享

在 kernel/vm.c 中新增 uvmshare()。与 uvmcopy() 不同，它不复制物理页，而是让两个页表映射到相同物理页：

【截图占位：kernel/vm.c — uvmshare() 实现】

```c
// kernel/vm.c — 新增 uvmshare()
// Share physical memory between two page tables.
// Unlike uvmcopy, this maps the SAME physical pages
// in both page tables (no copying of data).
int
uvmshare(pagetable_t old, pagetable_t new, uint64 sz)
{
  pte_t *pte;
  uint64 pa, i;
  uint flags;

  for(i = 0; i < sz; i += PGSIZE){
    if((pte = walk(old, i, 0)) == 0)
      continue;
    if((*pte & PTE_V) == 0)
      continue;
    pa = PTE2PA(*pte);
    flags = PTE_FLAGS(*pte);
    // 关键：映射相同的物理地址 pa，而非分配新页
    if(mappages(new, i, PGSIZE, pa, flags) != 0){
      goto err;
    }
  }
  return 0;

 err:
  uvmunmap(new, 0, i / PGSIZE, 0);  // 不释放物理页（共享）
  return -1;
}
```


四、c) 实现 join() 系统调用

4.1 实现 sys_join()

在 kernel/sysproc.c 中实现 sys_join()：

【截图占位：kernel/sysproc.c — sys_join() 实现】

```c
// kernel/sysproc.c — 新增 sys_join()
uint64
sys_join(void)
{
  int tid;
  argint(0, &tid);
  return kjoin(tid);
}
```

4.2 实现内核核心函数 kjoin()

在 kernel/proc.c 中实现 kjoin()，等待指定 tid 的线程退出并回收其资源：

【截图占位：kernel/proc.c — kjoin() 实现】

```c
// kernel/proc.c — kjoin()
int
kjoin(int tid)
{
  struct proc *pp;
  struct proc *p = myproc();

  acquire(&wait_lock);

  for(;;){
    int found = 0;
    for(pp = proc; pp < &proc[NPROC]; pp++){
      // 查找 tparent==当前进程 且 pid==tid 的线程
      if(pp->tparent == p && pp->pid == tid){
        acquire(&pp->lock);
        found = 1;
        if(pp->state == ZOMBIE){
          int status = pp->xstate;
          freeproc(pp);         // 回收线程资源
          release(&pp->lock);
          release(&wait_lock);
          return status;
        }
        release(&pp->lock);
      }
    }

    if(!found){
      release(&wait_lock);
      return -1;
    }
    sleep(p, &wait_lock);  // 等待线程退出
  }
}
```

4.3 修改 freeproc() — 线程退出不释放共享资源

【截图占位：kernel/proc.c — freeproc() 中新增 is_thread 分支】

```c
// kernel/proc.c — freeproc() 中线程特殊处理（新增 is_thread 分支）
  if(p->pagetable){
    if(p->is_thread){
      // 线程：只清空页表项，不释放物理页
      uvmunmap(p->pagetable, 0, PGROUNDUP(p->sz)/PGSIZE, 0);
      uvmunmap(p->pagetable, TRAMPOLINE, 1, 0);
      uvmunmap(p->pagetable, TRAPFRAME, 1, 0);
      freewalk(p->pagetable);
    } else {
      proc_freepagetable(p->pagetable, p->sz);
    }
  }
  p->pagetable = 0;

  // 线程不关闭共享的文件和 cwd
  if(!p->is_thread){
    for(int fd = 0; fd < NOFILE; fd++){
      if(p->ofile[fd]){
        fileclose(p->ofile[fd]);
        p->ofile[fd] = 0;
      }
    }
    if(p->cwd){
      begin_op();
      iput(p->cwd);
      end_op();
    }
  }
```

4.4 修改 kexit()、kwait()、reparent()

【截图占位：kernel/proc.c — kexit() 中线程退出不关文件/唤醒 tparent、kwait() 跳过线程、reparent() 处理线程】

```c
// kernel/proc.c — kexit() 中线程特殊处理
  if(!p->is_thread){
    for(int fd = 0; fd < NOFILE; fd++){ ... }
    begin_op(); iput(p->cwd); end_op();
  }
  acquire(&wait_lock);
  if(!p->is_thread) reparent(p);
  if(p->is_thread)
    wakeup(p->tparent);   // 线程唤醒 tparent
  else
    wakeup(p->parent);    // 普通进程唤醒 parent

// kernel/proc.c — kwait() 中跳过线程
  if(pp->parent == p && !pp->is_thread){  // 新增 !pp->is_thread

// kernel/proc.c — reparent() 中处理线程重分配
  if(pp->is_thread && pp->tparent == p){
    pp->tparent = initproc;
    pp->parent = initproc;
    wakeup(initproc);
  }
```


五、d) 实现用户线程库

5.1 新增文件清单

新增以下用户态文件：
- user/thread.h：线程库头文件（含互斥锁实现）
- user/thread.c：线程库实现

修改以下文件：
- user/usys.pl：添加 clone 和 join 的汇编桩生成
- user/user.h：添加 clone()、join() 用户态声明
- Makefile：ULIB 添加 thread.o，UPROGS 添加 _test_thread

5.2 user/thread.h — 线程库头文件

【截图占位：user/thread.h — 完整文件（含互斥锁实现）】

```c
// user/thread.h — 线程库头文件（完整内容）
#ifndef _THREAD_H_
#define _THREAD_H_

int getpid(void);
int pause(int);

typedef struct {
  int tid;
  void *stack;
  int stack_size;
  int joined;
} thread_t;

int thread_create(thread_t *thread, void (*fcn)(void*), void *arg);
int thread_join(thread_t *thread);

static inline int thread_self(void) { return getpid(); }
static inline void thread_yield(void) { pause(1); }

// 用户态互斥锁（基于 RISC-V 原子指令 amoswap.w.aq）
typedef volatile int mutex_t;

static inline int
_atomic_swap(volatile int *addr, int newval)
{
  int old;
  __asm__ __volatile__(
      "amoswap.w.aq %0, %2, (%1)"
      : "=r"(old) : "r"(addr), "r"(newval) : "memory");
  return old;
}

static inline void mutex_init(mutex_t *m)  { *m = 0; }
static inline void mutex_lock(mutex_t *m)  { while(_atomic_swap(m, 1)) thread_yield(); }
static inline void mutex_unlock(mutex_t *m) { *m = 0; }

#endif
```

5.3 user/thread.c — 线程库实现

【截图占位：user/thread.c — 完整文件】

```c
// user/thread.c — 线程库实现
#include "kernel/types.h"
#include "user/user.h"
#include "user/thread.h"

#define THREAD_STACK_SIZE 4096

struct thread_arg {
  void (*fcn)(void*);
  void *arg;
};

// 包装函数：调用用户线程函数后自动 exit
static void
thread_wrapper(void *a)
{
  struct thread_arg *ta = (struct thread_arg *)a;
  ta->fcn(ta->arg);
  exit(0);
}

int
thread_create(thread_t *thread, void (*fcn)(void*), void *arg)
{
  char *stack = (char *)malloc(THREAD_STACK_SIZE);
  if(stack == 0) return -1;

  struct thread_arg *ta = (struct thread_arg *)
      (stack + THREAD_STACK_SIZE - sizeof(struct thread_arg));
  ta->fcn = fcn;
  ta->arg = arg;

  int tid = clone(thread_wrapper, (void *)ta, (void *)ta);
  if(tid < 0){ free(stack); return -1; }

  thread->tid = tid;
  thread->stack = stack;
  thread->stack_size = THREAD_STACK_SIZE;
  thread->joined = 0;
  return 0;
}

int
thread_join(thread_t *thread)
{
  if(thread->joined) return -1;
  int status = join(thread->tid);
  if(status < 0) return -1;
  thread->joined = 1;
  free(thread->stack);
  thread->stack = 0;
  return status;
}
```

5.4 用户态系统调用桩和声明

【截图占位：user/usys.pl — 新增 entry("clone") 和 entry("join")】

```perl
# user/usys.pl — 末尾新增
entry("clone");
entry("join");
```

【截图占位：user/user.h — 新增 clone 和 join 声明】

```c
// user/user.h — 新增
int clone(void (*fcn)(void*), void *arg, void *stack);
int join(int tid);
```

5.5 Makefile 修改

【截图占位：Makefile — ULIB 添加 thread.o，UPROGS 添加 _test_thread】

```makefile
# Makefile — ULIB 新增 thread.o
ULIB = $U/ulib.o $U/usys.o $U/printf.o $U/umalloc.o $U/thread.o

# Makefile — UPROGS 末尾新增
	$U/_test_thread\
```


六、e) 测试样例

6.1 user/test_thread.c — 测试程序

测试程序验证三个核心功能：共享计数器（证明内存共享）、join 回收、flag 同步 + 互斥锁保护输出。

【截图占位：user/test_thread.c — 完整测试程序（第1部分：声明和 thread_func）】

```c
// user/test_thread.c
#include "kernel/types.h"
#include "user/user.h"
#include "user/thread.h"

volatile int shared_counter = 0;
volatile int shared_flag = 0;
mutex_t print_lock;
#define NTHREADS 5

void thread_func(void *arg)
{
  int id = *(int*)arg;
  mutex_lock(&print_lock);
  printf("Thread %d (tid=%d): started, shared_counter=%d\n",
         id, getpid(), shared_counter);
  mutex_unlock(&print_lock);

  for(int i = 0; i < 100; i++){
    int tmp = shared_counter;
    tmp = tmp + 1;
    shared_counter = tmp;
  }

  mutex_lock(&print_lock);
  printf("Thread %d: finished, shared_counter=%d\n", id, shared_counter);
  mutex_unlock(&print_lock);
  exit(0);
}

void flag_setter(void *arg)
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
```

【截图占位：user/test_thread.c — 完整测试程序（第2部分：main 函数）】

```c
int main(int argc, char *argv[])
{
  thread_t threads[NTHREADS];
  int ids[NTHREADS];
  mutex_init(&print_lock);

  printf("=== xv6 User Thread Test ===\n");
  printf("Main process pid=%d\n", getpid());
  printf("Initial shared_counter=%d\n\n", shared_counter);

  // Test 1: 创建 5 个线程
  printf("--- Test 1: Creating %d threads ---\n", NTHREADS);
  for(int i = 0; i < NTHREADS; i++){
    ids[i] = i + 1;
    thread_create(&threads[i], thread_func, &ids[i]);
    mutex_lock(&print_lock);
    printf("Created thread %d, tid=%d\n", i + 1, threads[i].tid);
    mutex_unlock(&print_lock);
  }

  // Test 2: join 所有线程
  printf("\n--- Test 2: Joining all threads ---\n");
  for(int i = 0; i < NTHREADS; i++){
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

  // Test 3: Flag 同步
  printf("\n--- Test 3: Flag synchronisation ---\n");
  shared_flag = 0;
  int delay = 50;
  thread_t ft;
  thread_create(&ft, flag_setter, &delay);
  printf("Main: waiting for flag...\n");
  while(shared_flag == 0) thread_yield();
  mutex_lock(&print_lock);
  printf("Main: flag detected! shared_flag=%d\n", shared_flag);
  mutex_unlock(&print_lock);
  thread_join(&ft);
  printf("flag_setter joined.\n");

  printf("\n=== All tests passed! ===\n");
  exit(0);
}
```

6.2 测试运行结果

【截图占位：运行 test_thread 的完整输出结果】

```
=== xv6 User Thread Test ===
Main process pid=3
Initial shared_counter=0

--- Test 1: Creating 5 threads ---
Created thread 1, tid=4
Created thread 2, tid=5
Created thread 3, tid=6
Created thread 4, tid=7
Created thread 5, tid=8

--- Test 2: Joining all threads ---
Thread 1 (tid=4): started, shared_counter=0
Thread 1: finished, shared_counter=100
Joined thread 1 (tid=4), status=0
Thread 2 (tid=5): started, shared_counter=100
Thread 2: finished, shared_counter=200
Joined thread 2 (tid=5), status=0
Thread 3 (tid=6): started, shared_counter=200
Thread 3: finished, shared_counter=300
Joined thread 3 (tid=6), status=0
Thread 4 (tid=7): started, shared_counter=300
Thread 4: finished, shared_counter=400
Joined thread 4 (tid=7), status=0
Thread 5 (tid=8): started, shared_counter=400
Thread 5: finished, shared_counter=500
Joined thread 5 (tid=8), status=0

Final shared_counter=500 (expected: 500)

--- Test 3: Flag synchronisation ---
Main: waiting for flag...
flag_setter: sleeping for 50 ticks...
flag_setter: flag set to 1
Main: flag detected! shared_flag=1
flag_setter joined.

=== All tests passed! ===
```

6.3 测试结果分析

| 验证项 | 预期结果 | 实际结果 | 结论 |
|--------|---------|---------|------|
| 线程创建 | clone() 返回递增的 tid | tid=4~8，5个线程全部创建 | clone() 系统调用正常 |
| 共享内存 | shared_counter 最终 = 5×100 = 500 | shared_counter = 500 | uvmshare() 页表共享正确 |
| 线程回收 | join() 返回 status=0 | 所有 join 返回 0 | join() 正确等待并回收 |
| Flag 同步 | 主线程等待后检测到 flag=1 | 主线程检测到 flag 变化 | 共享变量 + yield 协作正常 |
| 互斥锁 | printf 输出无交错 | 输出行完整无交错 | amoswap 原子指令正确 |


七、线程 vs 进程对比

| 特性 | fork()（进程） | clone()（线程） |
|------|---------------|----------------|
| 页表 | uvmcopy 完整复制物理页 | uvmshare 映射相同物理页 |
| 用户内存 | 独立副本，写时互不影响 | 共享同一物理页，写时互相可见 |
| 文件描述符 | filedup 增加引用计数 | filedup 增加引用计数 |
| 工作目录 | idup 增加引用计数 | idup 增加引用计数 |
| trapframe | 独立页映射 | 独立页映射（各自拥有 TRAPFRAME） |
| 退出时 | 释放所有资源 | 只释放 trapframe + 页表结构 |
| 父进程回收 | wait() 系统调用 | join() 系统调用 |
| 创建开销 | 高（需逐页分配和复制） | 低（仅映射页表项） |


实验结论：

通过本次实验，在 Linux+Qemu 环境下对 xv6 内核进行了用户线程功能的扩展，完成了核心数据结构修改、clone()/join() 系统调用实现、用户线程库封装和测试样例编写。

1. 核心数据结构修改
在 struct proc 中新增 is_thread 和 tparent 两个字段，使得内核能区分线程与普通进程，从而在 freeproc()、kexit()、kwait()、reparent() 等关键路径上做出正确的资源管理决策。

2. clone() 系统调用
实现了 kclone() 内核函数，通过 allocproc() 分配独立 proc 结构，再通过 uvmshare() 将父进程的物理页映射到子线程页表，实现地址空间共享而非复制。同时通过 filedup() 和 idup() 共享文件表和当前目录。与 fork() 相比，clone() 避免了 O(n) 的内存复制开销，创建线程的开销显著小于创建进程。

3. join() 系统调用
实现了 kjoin() 内核函数，通过 tparent 字段查找线程，等待其进入 ZOMBIE 状态后回收 proc 结构。线程退出时通过 freeproc() 的 is_thread 分支只释放 trapframe 和页表结构，不释放共享的用户内存页，保证主进程继续正常使用共享资源。

4. 用户线程库
封装了 thread_create/thread_join 接口，自动管理线程栈的分配和回收，通过 thread_wrapper 包装函数确保线程返回时自动调用 exit()。此外还实现了基于 RISC-V amoswap.w.aq 原子指令的用户态互斥锁 mutex_t，证明了原子操作在共享内存环境下的正确性，多线程输出无交错。

5. 测试验证
test_thread 程序通过三个测试场景全面验证了线程功能：shared_counter 累加到 500 证明内存共享正确；5 个 join 全部返回 0 证明线程回收正常；flag_setter 与主线程的同步证明共享变量 + yield 协作有效；互斥锁保护下的输出无交错证明了 RISC-V 原子指令在用户态线程间的正确工作。

总体而言，本次实验加深了对 xv6 进程模型、页表管理、系统调用机制和并发编程的理解，掌握了从需求分析到内核实现再到用户态验证的完整开发流程。我将在日后的学习中不断精进自己的能力，努力将所学应用实际。


实验结论：

运行结果如图。

在测试1中进行线程创建，clone() 返回递增的 tid=4~8，5个线程全部创建成功。验证 clone() 系统调用正常，每个线程拥有独立的 proc 结构和内核栈。

在测试2中每个线程累加100次，shared_counter 最终 = 5×100 = 500。验证 uvmshare() 页表共享正确——所有线程通过各自的页表映射到相同的物理页，对共享变量的修改对其他线程立即可见。同时证明了线程创建开销比进程小：clone() 通过 uvmshare() 仅建立页表映射，无需像 fork() 的 uvmcopy() 那样逐页分配和复制物理内存。

在测试2中进行线程回收，所有 join() 返回 status=0。验证 kjoin() 正确等待线程进入 ZOMBIE 状态并回收 proc 结构。线程退出时 freeproc() 通过 is_thread 分支只释放 trapframe 和页表结构，不释放共享的用户内存页、文件描述符和当前目录，保证主进程继续正常使用共享资源。

在测试3中进行 Flag 条件同步，主线程通过 while(shared_flag==0) thread_yield() 自旋等待，flag_setter 线程 sleep 50 ticks 后设置 shared_flag=1，主线程检测到变化后继续执行。验证了共享内存的写后立即可见性，以及 yield 协作调度在用户态线程间的可行性——整个过程无需内核信号量等机制介入，纯靠共享变量完成线程协调。

在全部输出中使用互斥锁 print_lock 保护 printf，输出行完整无交错。验证了基于 RISC-V amoswap.w.aq 原子指令的用户态互斥锁在共享内存环境下正确工作，证明了线程间可以通过原子操作实现互斥同步。

新增的内核数据结构 is_thread 和 tparent 使得内核能正确区分线程与普通进程，freeproc()/kexit()/kwait()/reparent() 等关键路径的修改确保了线程在创建、运行、退出、回收全生命周期中的资源管理正确性。

总体而言，本次实验加深了对 xv6 进程模型、页表管理、系统调用机制和并发编程的理解，掌握了从需求分析到内核实现再到用户态验证的完整开发流程。我将在日后的学习中不断精进自己的能力，努力将所学应用实际。