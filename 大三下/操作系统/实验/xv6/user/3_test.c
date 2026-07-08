#include "kernel/types.h"
#include "user/user.h"

static void
test_blocking(void)
{
	printf("[test_blocking] start\n");

	if(sem_init(0, 0) < 0) {
		printf("sem_init failed\n");
		exit(1);
	}

	int pid = fork();
	if(pid < 0) {
		printf("fork failed\n");
		exit(1);
	}

	if(pid == 0) {
		printf("child waiting at tick %d\n", uptime());
		sem_wait(0);
		printf("child passed at tick %d\n", uptime());
		exit(0);
	}

	{
		int start = uptime();
		while (uptime() - start < 5) {
			// busy-wait to ensure child blocks first
		}
	}
	printf("parent post at tick %d\n", uptime());
	sem_post(0);
	wait(0);
	sem_destroy(0);
}

static void
test_mutex(void)
{
	printf("[test_mutex] start\n");

	if(sem_init(1, 1) < 0 || sem_init(2, 0) < 0) {
		printf("sem_init failed\n");
		exit(1);
	}

	int pid = fork();
	if(pid < 0) {
		printf("fork failed\n");
		exit(1);
	}

	if(pid == 0) {
		for(int i = 0; i < 5; i++) {
			sem_wait(2);
			printf("child %d\n", i);
			sem_post(1);
		}
		exit(0);
	}

	for(int i = 0; i < 5; i++) {
		sem_wait(1);
		printf("parent %d\n", i);
		sem_post(2);
	}

	if(pid > 0)
		wait(0);

	if(pid > 0)
		sem_destroy(1);
	if(pid > 0)
		sem_destroy(2);
}

int
main(void)
{
	test_blocking();
	test_mutex();
	exit(0);
}
