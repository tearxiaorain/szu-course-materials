/*==============================================================*/
/* DBMS name:      MySQL 5.0                                    */
/* Created on:     2025/12/29 3:54:52                           */
/*==============================================================*/


alter table apply31 
   drop foreign key FK_APPLY31_PET_APPLY_PET31;

alter table apply31 
   drop foreign key FK_APPLY31_USER_APPL_USER31;

alter table breed31 
   drop foreign key FK_BREED31_BREED_CLA_CLASS31;

alter table pet31 
   drop foreign key FK_PET31_PET_BREED_BREED31;

alter table pet31 
   drop foreign key FK_PET31_PET_CLASS_CLASS31;

alter table review31 
   drop foreign key FK_REVIEW31_APPLY_REV_APPLY31;

alter table user31 
   drop foreign key FK_USER31_USER_AREA_AREA31;

alter table user31 
   drop foreign key FK_USER31_USER_STAT_STATE31;

/*==============================================================*/
/* Table: apply31                                               */
/*==============================================================*/
create table apply31
(
   apply_id             int not null  comment '',
   user_id              int  comment '',
   pet_id               int  comment '',
   apply_user_id        int  comment '',
   apply_pet_id         int  comment '',
   apply_time           date  comment '',
   apply_state_id       int  comment '',
   apply_user_name      varchar(1024)  comment '',
   apply_user_sex       int  comment '',
   apply_user_age       int  comment '',
   apply_user_phone     varchar(1024)  comment '',
   apply_user_email     varchar(1024)  comment '',
   apply_user_area_id   int  comment '',
   primary key (apply_id)
);

/*==============================================================*/
/* Table: area31                                                */
/*==============================================================*/
create table area31
(
   area_id              int not null  comment '',
   area_name            varchar(1024)  comment '',
   area_superior_id     int  comment '',
   area_type            int  comment '',
   primary key (area_id)
);

/*==============================================================*/
/* Table: breed31                                               */
/*==============================================================*/
create table breed31
(
   breed_id             int not null  comment '',
   class_id             int  comment '',
   breed_name           varchar(1024)  comment '',
   breed_class_id       int  comment '',
   primary key (breed_id)
);

/*==============================================================*/
/* Table: class31                                               */
/*==============================================================*/
create table class31
(
   class_id             int not null  comment '',
   class_name           varchar(1024)  comment '',
   primary key (class_id)
);

/*==============================================================*/
/* Table: pet31                                                 */
/*==============================================================*/
create table pet31
(
   pet_id               int not null  comment '',
   breed_id             int  comment '',
   class_id             int  comment '',
   pet_name             varchar(1024)  comment '',
   pet_birth            date  comment '',
   pet_age              int  comment '',
   pet_sex              int  comment '',
   pet_breed_id         int  comment '',
   pet_class_id         int  comment '',
   pet_color            varchar(1024)  comment '',
   pet_personality      varchar(1024)  comment '',
   primary key (pet_id)
);

/*==============================================================*/
/* Table: review31                                              */
/*==============================================================*/
create table review31
(
   review_id            int not null  comment '',
   apply_id             int  comment '',
   review_apply_id      int  comment '',
   review_time          date  comment '',
   review_result        int  comment '',
   primary key (review_id)
);

/*==============================================================*/
/* Table: state31                                               */
/*==============================================================*/
create table state31
(
   state_id             int not null  comment '',
   state_name           varchar(1024)  comment '',
   state_description    varchar(1024)  comment '',
   primary key (state_id)
);

/*==============================================================*/
/* Table: user31                                                */
/*==============================================================*/
create table user31
(
   user_id              int not null  comment '',
   state_id             int  comment '',
   area_id              int  comment '',
   user_name            varchar(1024)  comment '',
   user_password        varchar(1024)  comment '',
   user_state_id        int  comment '',
   user_age             int  comment '',
   user_real_name       varchar(1024)  comment '',
   user_sex             int  comment '',
   user_phone           varchar(1024)  comment '',
   user_email           varchar(1024)  comment '',
   user_area_id         int  comment '',
   primary key (user_id)
);

alter table apply31 add constraint FK_APPLY31_PET_APPLY_PET31 foreign key (pet_id)
      references pet31 (pet_id) on delete restrict on update restrict;

alter table apply31 add constraint FK_APPLY31_USER_APPL_USER31 foreign key (user_id)
      references user31 (user_id) on delete restrict on update restrict;

alter table breed31 add constraint FK_BREED31_BREED_CLA_CLASS31 foreign key (class_id)
      references class31 (class_id) on delete restrict on update restrict;

alter table pet31 add constraint FK_PET31_PET_BREED_BREED31 foreign key (breed_id)
      references breed31 (breed_id) on delete restrict on update restrict;

alter table pet31 add constraint FK_PET31_PET_CLASS_CLASS31 foreign key (class_id)
      references class31 (class_id) on delete restrict on update restrict;

alter table review31 add constraint FK_REVIEW31_APPLY_REV_APPLY31 foreign key (apply_id)
      references apply31 (apply_id) on delete restrict on update restrict;

alter table user31 add constraint FK_USER31_USER_AREA_AREA31 foreign key (area_id)
      references area31 (area_id) on delete restrict on update restrict;

alter table user31 add constraint FK_USER31_USER_STAT_STATE31 foreign key (state_id)
      references state31 (state_id) on delete restrict on update restrict;

