# ================================================================
# Makefile -- Instant Chat System chatserver_yjw
# ================================================================

CC      = gcc
CFLAGS  = -Wall -g -pthread -I./include -Wno-format-truncation -Wno-restrict
LDFLAGS = -pthread

# Targets
all: server client bot_manager

# Server (includes thread pool, config, logger)
server: src/server.c src/thread_pool.c src/config.c src/logger.c include/common.h
	$(CC) $(CFLAGS) -o server src/server.c src/thread_pool.c src/config.c src/logger.c $(LDFLAGS)

# Client
client: src/client.c src/config.c include/common.h
	$(CC) $(CFLAGS) -o client src/client.c src/config.c $(LDFLAGS)

# Bot Manager
bot_manager: src/bot_manager.c src/config.c include/common.h
	$(CC) $(CFLAGS) -o bot_manager src/bot_manager.c src/config.c $(LDFLAGS)

# Clean
clean:
	rm -f server client bot_manager
	rm -f *.o

.PHONY: all clean
