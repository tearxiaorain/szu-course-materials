/* clientinfo.h */

#ifndef _CLIENTINFO_H
#define _CLIENTINFO_H

typedef struct {
    char clientfifo[256];   /* client's FIFO name */
    char name[256];     /* client's name */
    char passwd[256];   /* client's password */
} CLIENTINFO_1, *CLIENTINFOPTR_1;

typedef struct {
    char clientfifo[256];   /* client's FIFO name */
    char name[256];     /* client's name */
    char passwd[256];   /* client's password */
} CLIENTINFO_2, *CLIENTINFOPTR_2;

typedef struct {
    char clientfifo[256];   /* client's FIFO name */
    char message[256];  /* client's message */
    char from_user[256];
    char to_user[256];
} CLIENTINFO_3, *CLIENTINFOPTR_3;

#endif