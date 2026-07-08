SET SERVEROUTPUT ON;

DECLARE
    v_username VARCHAR2(50);
    v_password VARCHAR2(50);
    v_random_number NUMBER;
    v_random_char CHAR(1);
    v_password_length CONSTANT PLS_INTEGER := 6;
BEGIN
     -- 输出 CSV 文件头
    DBMS_OUTPUT.PUT_LINE('Username,Password');

    FOR i IN 1..200 LOOP
        v_username := 'student' || i;
        
        -- 生成随机密码
        v_password := '';
        FOR j IN 1..v_password_length LOOP
            v_random_number := DBMS_RANDOM.VALUE(1, 36);
            IF v_random_number <= 10 THEN
                v_random_char := CHR(ASCII('0') + v_random_number - 1);
            ELSE
                v_random_char := CHR(ASCII('A') + v_random_number - 11);
            END IF;
            v_password := v_password || v_random_char;
        END LOOP;
        
        -- 创建用户并赋予权限
        EXECUTE IMMEDIATE 'CREATE USER ' || v_username || ' IDENTIFIED BY ' || v_password;
        EXECUTE IMMEDIATE 'GRANT CONNECT TO ' || v_username;
        EXECUTE IMMEDIATE 'GRANT RESOURCE TO ' || v_username;
        EXECUTE IMMEDIATE 'GRANT CREATE VIEW TO ' || v_username;
        EXECUTE IMMEDIATE 'GRANT SELECT_CATALOG_ROLE  TO ' || v_username;
        
        
        -- 输出用户名和密码到 CSV 格式
        DBMS_OUTPUT.PUT_LINE(v_username || ',' || v_password);
    END LOOP;
END;
/