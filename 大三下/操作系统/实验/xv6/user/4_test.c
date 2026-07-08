#include "kernel/types.h"
#include "user/user.h"

static void
test_sizes(void)
{
	int sizes[] = {16, 32, 64, 128, 256, 512, 1024, 2048};
	int n = sizeof(sizes) / sizeof(sizes[0]);

	printf("[slab] alloc/free by size\n");
	for(int i = 0; i < n; i++) {
		void *p = slab_alloc(sizes[i]);
		printf("size %d -> %p\n", sizes[i], p);
		if(p == 0)
			printf("alloc failed for size %d\n", sizes[i]);
		else
			slab_free(p);
	}
}

static void
test_limits(void)
{
	printf("[slab] invalid size test\n");
	void *p = slab_alloc(4096);
	printf("size 4096 -> %p (expect 0)\n", p);
}

int
main(void)
{
	test_sizes();
	test_limits();
	exit(0);
}
