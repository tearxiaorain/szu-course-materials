# xv6 用户线程实验 — 验证说明

## 测试输出（干净版，互斥锁保护后）

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

---

## 验证要点分析

### 1. 线程创建（Test 1）— 验证 `clone()` 系统调用

- 主进程 pid=3，通过 `clone()` 创建了 5 个线程（tid=4~8）
- 每个线程有独立的 pid/tid，与主进程不同
- **创建开销比 `fork()` 小**：线程共享页表（`uvmshare` 只映射页表项，不复制物理页），而 `fork()` 需 `uvmcopy` 完整复制所有用户内存页

### 2. 共享内存（Test 2）— 验证地址空间共享

- 全局变量 `shared_counter` 初始为 0
- Thread 1 看到 `shared_counter=0`，完成后变为 100
- Thread 2 看到 `shared_counter=100`，完成后变为 200
- Thread 3 看到 `shared_counter=200`，完成后变为 300
- Thread 4 看到 `shared_counter=300`，完成后变为 400
- Thread 5 看到 `shared_counter=400`，完成后变为 500
- **最终值 = 500 = 5 × 100**，证明所有线程操作的是**同一个物理页上的同一个变量**
- 每个线程的累加是串行的（因为 xv6 协作式调度 + `thread_join` 等待），但都正确读写了共享内存

### 3. 线程回收（Test 2）— 验证 `join()` 系统调用

- 所有 5 个 `thread_join()` 返回 `status=0`（线程正常退出的状态码）
- `join()` 正确等待线程进入 ZOMBIE 状态，回收 proc 结构和内核栈
- 线程的共享资源（用户内存页、文件表、cwd）**不被释放**，由主进程继续持有

### 4. 线程间同步（Test 3）— 验证共享变量 + yield 协作

- 主线程通过 `shared_flag` 轮询等待，用 `thread_yield()` 主动让出 CPU
- `flag_setter` 线程 sleep 50 ticks 后设置 `shared_flag=1`
- 主线程检测到 flag 变化后继续执行
- `thread_join()` 回收 flag_setter，返回正常状态

### 5. 用户态互斥锁 — 验证 RISC-V 原子指令 + 共享内存

- `print_lock` 是全局共享变量（`mutex_t`，本质是 `volatile int`）
- `mutex_lock()` 使用 RISC-V `amoswap.w.aq` 原子交换指令实现 test-and-set
- 竞争失败时调用 `thread_yield()` 让出 CPU，避免忙等浪费
- **输出无交错**，证明互斥锁在多线程间正确工作
- 这说明：不同线程虽然拥有独立页表，但通过 `uvmshare` 映射到同一物理页，原子指令能正确作用在该共享物理地址上

---

## 核心实现机制总结

| 实验要求 | 实现 | 验证结果 |
|----------|------|---------|
| a) 修改核心数据结构 | `struct proc` 添加 `is_thread`, `tparent` | 编译通过，线程正确标记 |
| b) `clone()` 系统调用 | `kclone()` → `allocproc()` + `uvmshare()` + 共享 ofile/cwd | 创建 5 个线程，tid=4~8 |
| c) `join()` 系统调用 | `kjoin()` 等待 ZOMBIE → `freeproc()` 回收 | 全部返回 status=0 |
| d) 用户线程库 | `thread_create`/`thread_join`/`mutex_lock`/`mutex_unlock` | API 封装简洁可用 |
| e) 测试样例 | 共享计数器 + Flag 同步 + 互斥锁保护输出 | `shared_counter=500`，输出无交错 |
