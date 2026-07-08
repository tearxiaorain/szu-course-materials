#ifndef PROTOCOL_H
#define PROTOCOL_H

/* ================================================================
 * protocol.h —— 请求/响应协议对齐声明
 *
 * 同台机器传输，使用 #pragma pack(1) 保证结构体对齐一致。
 * request_t 和 response_t 的完整定义在 common.h 中，
 * 本文件仅做对齐声明和协议校验。
 * ================================================================ */

#include "common.h"

/* 确保结构体按1字节对齐（同机器传输无需考虑字节序） */
#pragma pack(push, 1)

/* request_t 和 response_t 已在 common.h 中定义并 pack(1) */

#pragma pack(pop)

#endif /* PROTOCOL_H */
