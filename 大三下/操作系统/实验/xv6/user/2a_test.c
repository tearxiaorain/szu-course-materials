#include "kernel/types.h"
#include "user/user.h"

#define SLICE_TICKS 100
#define RUN_TICKS   300

static void
worker(char tag)
{
	int last = uptime();
	int end = last + RUN_TICKS;
	int run_ticks = 0;

	printf("%c start\n", tag);

	while (1) {
		int now = uptime();
		if (now >= end)
			break;
		if (now != last) {
			run_ticks += now - last;
			last = now;
			if (run_ticks >= SLICE_TICKS) {
				printf("%c %d\n", tag, now);
				run_ticks = 0;
			}
		}
	}
	exit(0);
}

int
main(void)
{
	int pid1 = fork();
	if (pid1 < 0) {
		printf("fork 1 failed\n");
		exit(1);
	}
	if (pid1 == 0)
		worker('A');

	int pid2 = fork();
	if (pid2 < 0) {
		printf("fork 2 failed\n");
		exit(1);
	}
	if (pid2 == 0)
		worker('B');

	printf("2a_test: slice=%d run=%d\n", SLICE_TICKS, RUN_TICKS);

	wait(0);
	wait(0);
	exit(0);
}