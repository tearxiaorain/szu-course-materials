/*==============================================================*/
/* DBMS name:      MySQL 5.0                                    */
/* Created on:     2025/10/9 9:11:00                            */
/*==============================================================*/


alter table Course 
   drop foreign key FK_COURSE_RELATIONS_TEACHER;

alter table CourseSelection 
   drop foreign key FK_COURSESE_RELATIONS_STUDENT;

alter table CourseSelection 
   drop foreign key FK_COURSESE_RELATIONS_COURSE;


alter table Course 
   drop foreign key FK_COURSE_RELATIONS_TEACHER;

drop table if exists Course;


alter table CourseSelection 
   drop foreign key FK_COURSESE_RELATIONS_STUDENT;

alter table CourseSelection 
   drop foreign key FK_COURSESE_RELATIONS_COURSE;

drop table if exists CourseSelection;

drop table if exists Student;

drop table if exists Teacher;

/*==============================================================*/
/* Table: Course                                                */
/*==============================================================*/
create table Course
(
   CurNumber            char(10) not null  comment '',
   TeaNumber            char(10) not null  comment '',
   CurName              char(10) not null  comment '',
   Credit               int not null  comment '',
   ClassHour            int not null  comment '',
   primary key (CurNumber, TeaNumber)
);

/*==============================================================*/
/* Table: CourseSelection                                       */
/*==============================================================*/
create table CourseSelection
(
   CurNumber            char(10) not null  comment '',
   TeaNumber            char(10) not null  comment '',
   StuNumber            char(10) not null  comment '',
   primary key (CurNumber, TeaNumber, StuNumber)
);

/*==============================================================*/
/* Table: Student                                               */
/*==============================================================*/
create table Student
(
   StuNumber            char(10) not null  comment '',
   StuName              char(10) not null  comment '',
   Sex                  char(2) not null  comment '',
   Major                char(10) not null  comment '',
   primary key (StuNumber)
);

/*==============================================================*/
/* Table: Teacher                                               */
/*==============================================================*/
create table Teacher
(
   TeaNumber            char(10) not null  comment '',
   TeaName              char(10) not null  comment '',
   Major                char(10) not null  comment '',
   ProTitle             char(10) not null  comment '',
   Age                  int not null  comment '',
   primary key (TeaNumber)
);

alter table Course add constraint FK_COURSE_RELATIONS_TEACHER foreign key (TeaNumber)
      references Teacher (TeaNumber) on delete restrict on update restrict;

alter table CourseSelection add constraint FK_COURSESE_RELATIONS_STUDENT foreign key (StuNumber)
      references Student (StuNumber) on delete restrict on update restrict;

alter table CourseSelection add constraint FK_COURSESE_RELATIONS_COURSE foreign key (CurNumber, TeaNumber)
      references Course (CurNumber, TeaNumber) on delete restrict on update restrict;

