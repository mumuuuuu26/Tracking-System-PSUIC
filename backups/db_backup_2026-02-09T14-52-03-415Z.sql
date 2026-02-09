-- MySQL dump 10.13  Distrib 9.4.0, for macos15 (arm64)
--
-- Host: localhost    Database: tracking_system
-- ------------------------------------------------------
-- Server version	9.4.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `_prisma_migrations`
--

DROP TABLE IF EXISTS `_prisma_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `_prisma_migrations` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `checksum` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `logs` text COLLATE utf8mb4_unicode_ci,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `applied_steps_count` int unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `_prisma_migrations`
--

LOCK TABLES `_prisma_migrations` WRITE;
/*!40000 ALTER TABLE `_prisma_migrations` DISABLE KEYS */;
INSERT INTO `_prisma_migrations` VALUES ('729b70cb-61f7-4fc7-b115-cfc1cfebfb86','b99566fd6017d5ecde6f0265e90f56d68edbf7d6f21c3eb0e34d13cdb4fad2b5','2026-02-09 07:33:08.138','20251226090138_init_new_system',NULL,NULL,'2026-02-09 07:33:08.055',1),('77edacd9-804d-41ce-9eb3-28734df60b91','7d9ef63c39f905e6d09f89664b4d6caeacf05457d2f8d4d4c34eac581e9bc587','2026-02-09 07:33:08.176','20251227185538_add_room_details',NULL,NULL,'2026-02-09 07:33:08.171',1),('a1979e60-1612-4b8d-97fd-191390489edf','19ade75a79eb4836ef0d04cefb8828b93a7f6e7f5a508f002bbd5881b0f8a65d','2026-02-09 07:33:08.171','20251227144808_add_it_support_features',NULL,NULL,'2026-02-09 07:33:08.138',1),('b08bbe4c-3b7e-4d9d-aa2f-d7d7f21f0609','baf2728a4614d2ac9ae4f1d49b1c89e3ea4c61de54641d20adc24acf3dddedc4','2026-02-09 07:33:43.357','20260209073343_add_indexes',NULL,NULL,'2026-02-09 07:33:43.289',1);
/*!40000 ALTER TABLE `_prisma_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ActivityLog`
--

DROP TABLE IF EXISTS `ActivityLog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ActivityLog` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ticketId` int NOT NULL,
  `action` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `detail` text COLLATE utf8mb4_unicode_ci,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedById` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ActivityLog_ticketId_fkey` (`ticketId`),
  KEY `ActivityLog_updatedById_fkey` (`updatedById`),
  CONSTRAINT `ActivityLog_ticketId_fkey` FOREIGN KEY (`ticketId`) REFERENCES `Ticket` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ActivityLog_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `User` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ActivityLog`
--

LOCK TABLES `ActivityLog` WRITE;
/*!40000 ALTER TABLE `ActivityLog` DISABLE KEYS */;
/*!40000 ALTER TABLE `ActivityLog` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Category`
--

DROP TABLE IF EXISTS `Category`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Category` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Category_name_key` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Category`
--

LOCK TABLES `Category` WRITE;
/*!40000 ALTER TABLE `Category` DISABLE KEYS */;
INSERT INTO `Category` VALUES (4,'Account'),(1,'Hardware'),(6,'Network'),(2,'Other'),(5,'Printer'),(3,'Software');
/*!40000 ALTER TABLE `Category` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `EmailTemplate`
--

DROP TABLE IF EXISTS `EmailTemplate`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `EmailTemplate` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subject` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `body` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `isEnabled` tinyint(1) NOT NULL DEFAULT '1',
  `variables` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `EmailTemplate_name_key` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `EmailTemplate`
--

LOCK TABLES `EmailTemplate` WRITE;
/*!40000 ALTER TABLE `EmailTemplate` DISABLE KEYS */;
/*!40000 ALTER TABLE `EmailTemplate` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Equipment`
--

DROP TABLE IF EXISTS `Equipment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Equipment` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `serialNo` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `qrCode` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Normal',
  `roomId` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Equipment_serialNo_key` (`serialNo`),
  UNIQUE KEY `Equipment_qrCode_key` (`qrCode`),
  KEY `Equipment_roomId_fkey` (`roomId`),
  CONSTRAINT `Equipment_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `Room` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Equipment`
--

LOCK TABLES `Equipment` WRITE;
/*!40000 ALTER TABLE `Equipment` DISABLE KEYS */;
INSERT INTO `Equipment` VALUES (1,'Computer-ROOM-201-3','Computer','SN-1770622443119-1-2','QR-2-2','Normal',2),(2,'Computer-ROOM-201-2','Computer','SN-1770622443119-1-1','QR-2-1','Normal',2),(3,'Computer-LAB-301-3','Computer','SN-1770622443119-0-2','QR-1-2','Normal',1),(4,'Computer-LAB-301-2','Computer','SN-1770622443119-0-1','QR-1-1','Normal',1),(5,'Computer-ROOM-201-1','Computer','SN-1770622443119-1-0','QR-2-0','Normal',2),(6,'Computer-LAB-301-1','Computer','SN-1770622443119-0-0','QR-1-0','Normal',1),(7,'Computer-ROOM-401-1','Computer','SN-1770622443119-2-0','QR-3-0','Normal',3),(8,'Computer-ROOM-401-2','Computer','SN-1770622443119-2-1','QR-3-1','Normal',3),(9,'Computer-ROOM-401-3','Computer','SN-1770622443119-2-2','QR-3-2','Normal',3);
/*!40000 ALTER TABLE `Equipment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Image`
--

DROP TABLE IF EXISTS `Image`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Image` (
  `id` int NOT NULL AUTO_INCREMENT,
  `asset_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `public_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `url` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `secure_url` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'before',
  `ticketId` int NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `Image_ticketId_fkey` (`ticketId`),
  CONSTRAINT `Image_ticketId_fkey` FOREIGN KEY (`ticketId`) REFERENCES `Ticket` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Image`
--

LOCK TABLES `Image` WRITE;
/*!40000 ALTER TABLE `Image` DISABLE KEYS */;
INSERT INTO `Image` VALUES (1,'local','local','/uploads/872de3f6-003b-4282-b0e2-245daf835994.jpeg','/uploads/872de3f6-003b-4282-b0e2-245daf835994.jpeg','before',3,'2026-02-09 08:09:00.978');
/*!40000 ALTER TABLE `Image` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Notification`
--

DROP TABLE IF EXISTS `Notification`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Notification` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `ticketId` int DEFAULT NULL,
  `title` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `read` tinyint(1) NOT NULL DEFAULT '0',
  `readAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `Notification_userId_fkey` (`userId`),
  KEY `Notification_ticketId_fkey` (`ticketId`),
  CONSTRAINT `Notification_ticketId_fkey` FOREIGN KEY (`ticketId`) REFERENCES `Ticket` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Notification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Notification`
--

LOCK TABLES `Notification` WRITE;
/*!40000 ALTER TABLE `Notification` DISABLE KEYS */;
INSERT INTO `Notification` VALUES (1,1,3,'New Ticket Created','Ticket #3: Hardware Issue','ticket_create',0,NULL,'2026-02-09 08:09:01.002'),(2,2,3,'New Ticket Created','Ticket #3: Hardware Issue','ticket_create',0,NULL,'2026-02-09 08:09:01.002'),(3,3,3,'New Ticket Created','Ticket #3: Hardware Issue','ticket_create',0,NULL,'2026-02-09 08:09:01.002'),(4,6,3,'New Ticket Created','Ticket #3: Hardware Issue','ticket_create',0,NULL,'2026-02-09 08:09:01.002'),(5,7,3,'New Ticket Created','Ticket #3: Hardware Issue','ticket_create',0,NULL,'2026-02-09 08:09:01.002');
/*!40000 ALTER TABLE `Notification` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `PersonalTask`
--

DROP TABLE IF EXISTS `PersonalTask`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `PersonalTask` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `title` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `date` datetime(3) NOT NULL,
  `startTime` datetime(3) DEFAULT NULL,
  `endTime` datetime(3) DEFAULT NULL,
  `color` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT '#3B82F6',
  `isCompleted` tinyint(1) NOT NULL DEFAULT '0',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `PersonalTask_userId_fkey` (`userId`),
  CONSTRAINT `PersonalTask_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=232 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `PersonalTask`
--

LOCK TABLES `PersonalTask` WRITE;
/*!40000 ALTER TABLE `PersonalTask` DISABLE KEYS */;
INSERT INTO `PersonalTask` VALUES (219,7,'work meeting','Imported from Google Calendar (psuichelpdesk@gmail.com)\n📍 PSU Campus Recreation Center, Academic and Student Recreation Center, 1800 SW 6th Ave, Portland, OR 97201, USA','2026-02-01 03:00:00.000','2026-02-01 03:00:00.000','2026-02-01 04:00:00.000','#4285F4',0,'2026-02-09 09:05:52.630','2026-02-09 09:05:52.630'),(220,7,'ประชุมงาน','Imported from Google Calendar (psuichelpdesk@gmail.com)','2026-02-02 03:00:00.000','2026-02-02 03:00:00.000','2026-02-02 04:00:00.000','#4285F4',0,'2026-02-09 09:05:52.630','2026-02-09 09:05:52.630'),(221,7,'พักเที่ยง','Imported from Google Calendar (psuichelpdesk@gmail.com)','2026-02-02 05:00:00.000','2026-02-02 05:00:00.000','2026-02-02 06:00:00.000','#4285F4',0,'2026-02-09 09:05:52.630','2026-02-09 09:05:52.630'),(222,7,'ตรวจงานที่ต้องเคลียร์ ดำเนินการให้เสร็จ','Imported from Google Calendar (psuichelpdesk@gmail.com)','2026-02-02 07:00:00.000','2026-02-02 07:00:00.000','2026-02-02 08:00:00.000','#4285F4',0,'2026-02-09 09:05:52.630','2026-02-09 09:05:52.630'),(223,7,'ตรวจสอบระบบภายใน','Imported from Google Calendar (psuichelpdesk@gmail.com)','2026-02-03 03:00:00.000','2026-02-03 03:00:00.000','2026-02-03 04:00:00.000','#4285F4',0,'2026-02-09 09:05:52.630','2026-02-09 09:05:52.630'),(224,7,'นิเทศนักศึกษาสหกิจ','Imported from Google Calendar (psuichelpdesk@gmail.com)','2026-02-03 07:00:00.000','2026-02-03 07:00:00.000','2026-02-03 08:00:00.000','#4285F4',0,'2026-02-09 09:05:52.630','2026-02-09 09:05:52.630'),(225,7,'เช็คเครีอข่าย server','Imported from Google Calendar (psuichelpdesk@gmail.com)','2026-02-04 00:00:00.000','2026-02-04 00:00:00.000','2026-02-05 00:00:00.000','#10B981',0,'2026-02-09 09:05:52.630','2026-02-09 09:05:52.630'),(226,7,'ตรวจงานนักศึกษาสหกิจ','Imported from Google Calendar (psuichelpdesk@gmail.com)','2026-02-05 00:00:00.000','2026-02-05 00:00:00.000','2026-02-06 00:00:00.000','#10B981',0,'2026-02-09 09:05:52.630','2026-02-09 09:05:52.630'),(227,7,'ประชุมงานฝ่ายแผนก','Imported from Google Calendar (psuichelpdesk@gmail.com)','2026-02-06 00:00:00.000','2026-02-06 00:00:00.000','2026-02-07 00:00:00.000','#10B981',0,'2026-02-09 09:05:52.630','2026-02-09 09:05:52.630'),(228,7,'ลางาน','Imported from Google Calendar (psuichelpdesk@gmail.com)','2026-02-11 00:00:00.000','2026-02-11 00:00:00.000','2026-02-12 00:00:00.000','#10B981',0,'2026-02-09 09:05:52.630','2026-02-09 09:05:52.630'),(229,7,'ลาหยุด','Imported from Google Calendar (psuichelpdesk@gmail.com)','2026-02-13 00:00:00.000','2026-02-13 00:00:00.000','2026-02-14 00:00:00.000','#10B981',0,'2026-02-09 09:05:52.630','2026-02-09 09:05:52.630'),(230,7,'ตรวจสอบการทำงานนักศึกษาสหกิจ','Imported from Google Calendar (psuichelpdesk@gmail.com)','2026-02-20 00:00:00.000','2026-02-20 00:00:00.000','2026-02-21 00:00:00.000','#10B981',0,'2026-02-09 09:05:52.630','2026-02-09 09:05:52.630'),(231,7,'กลับบ้าน','Imported from Google Calendar (psuichelpdesk@gmail.com)','2026-02-28 00:00:00.000','2026-02-28 00:00:00.000','2026-03-01 00:00:00.000','#10B981',0,'2026-02-09 09:05:52.630','2026-02-09 09:05:52.630');
/*!40000 ALTER TABLE `PersonalTask` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `QuickFix`
--

DROP TABLE IF EXISTS `QuickFix`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `QuickFix` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `image` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `category` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `views` int NOT NULL DEFAULT '0',
  `createdBy` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `QuickFix`
--

LOCK TABLES `QuickFix` WRITE;
/*!40000 ALTER TABLE `QuickFix` DISABLE KEYS */;
/*!40000 ALTER TABLE `QuickFix` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `RolePermission`
--

DROP TABLE IF EXISTS `RolePermission`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `RolePermission` (
  `id` int NOT NULL AUTO_INCREMENT,
  `role` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `viewTickets` tinyint(1) NOT NULL DEFAULT '0',
  `editTickets` tinyint(1) NOT NULL DEFAULT '0',
  `assignIT` tinyint(1) NOT NULL DEFAULT '0',
  `manageUsers` tinyint(1) NOT NULL DEFAULT '0',
  `manageEquipment` tinyint(1) NOT NULL DEFAULT '0',
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `RolePermission_role_key` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `RolePermission`
--

LOCK TABLES `RolePermission` WRITE;
/*!40000 ALTER TABLE `RolePermission` DISABLE KEYS */;
/*!40000 ALTER TABLE `RolePermission` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Room`
--

DROP TABLE IF EXISTS `Room`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Room` (
  `id` int NOT NULL AUTO_INCREMENT,
  `roomNumber` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `building` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `floor` int DEFAULT NULL,
  `capacity` int DEFAULT NULL,
  `imageUrl` longtext COLLATE utf8mb4_unicode_ci,
  `type` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Room_roomNumber_key` (`roomNumber`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Room`
--

LOCK TABLES `Room` WRITE;
/*!40000 ALTER TABLE `Room` DISABLE KEYS */;
INSERT INTO `Room` VALUES (1,'LAB-301','PSUIC',3,40,NULL,'Computer Lab'),(2,'ROOM-201','PSUIC',2,30,NULL,'Classroom'),(3,'ROOM-401','PSUIC',4,50,NULL,'Conference');
/*!40000 ALTER TABLE `Room` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Ticket`
--

DROP TABLE IF EXISTS `Ticket`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Ticket` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `urgency` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Normal',
  `status` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'not_start',
  `rating` int DEFAULT NULL,
  `userFeedback` text COLLATE utf8mb4_unicode_ci,
  `createdById` int NOT NULL,
  `assignedToId` int DEFAULT NULL,
  `roomId` int NOT NULL,
  `equipmentId` int DEFAULT NULL,
  `categoryId` int DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `notifiedAt` datetime(3) DEFAULT NULL,
  `readAt` datetime(3) DEFAULT NULL,
  `resolutionTime` int DEFAULT NULL,
  `responseTime` int DEFAULT NULL,
  `checklist` text COLLATE utf8mb4_unicode_ci,
  `deletedAt` datetime(3) DEFAULT NULL,
  `isDeleted` tinyint(1) NOT NULL DEFAULT '0',
  `note` text COLLATE utf8mb4_unicode_ci,
  `susDetails` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `Ticket_createdById_idx` (`createdById`),
  KEY `Ticket_assignedToId_idx` (`assignedToId`),
  KEY `Ticket_roomId_idx` (`roomId`),
  KEY `Ticket_equipmentId_idx` (`equipmentId`),
  KEY `Ticket_categoryId_fkey` (`categoryId`),
  KEY `Ticket_status_idx` (`status`),
  KEY `Ticket_isDeleted_idx` (`isDeleted`),
  KEY `Ticket_status_createdAt_idx` (`status`,`createdAt`),
  CONSTRAINT `Ticket_assignedToId_fkey` FOREIGN KEY (`assignedToId`) REFERENCES `User` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Ticket_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Ticket_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `Ticket_equipmentId_fkey` FOREIGN KEY (`equipmentId`) REFERENCES `Equipment` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Ticket_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `Room` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Ticket`
--

LOCK TABLES `Ticket` WRITE;
/*!40000 ALTER TABLE `Ticket` DISABLE KEYS */;
INSERT INTO `Ticket` VALUES (1,'Printer jam','Paper stuck in printer','Medium','in_progress',NULL,NULL,4,3,2,NULL,5,'2026-02-09 07:34:03.124','2026-02-09 07:34:03.124',NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL),(2,'Computer won\'t start','The computer in Lab 301 won\'t turn on','High','pending',NULL,NULL,4,NULL,1,6,1,'2026-02-09 07:34:03.124','2026-02-09 07:34:03.124',NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL),(3,'Hardware Issue','คอมห้องแลปเสีย','Medium','not_start',NULL,NULL,5,NULL,1,NULL,1,'2026-02-09 08:09:00.978','2026-02-09 08:09:00.978',NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL);
/*!40000 ALTER TABLE `Ticket` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `User`
--

DROP TABLE IF EXISTS `User`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `User` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `picture` longtext COLLATE utf8mb4_unicode_ci,
  `role` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'user',
  `enabled` tinyint(1) NOT NULL DEFAULT '1',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `avgRating` double NOT NULL DEFAULT '0',
  `department` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lineId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phoneNumber` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `totalRated` int NOT NULL DEFAULT '0',
  `totalResolved` int NOT NULL DEFAULT '0',
  `googleCalendarId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `isEmailEnabled` tinyint(1) NOT NULL DEFAULT '1',
  `notificationEmail` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `User_email_key` (`email`),
  UNIQUE KEY `User_username_key` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `User`
--

LOCK TABLES `User` WRITE;
/*!40000 ALTER TABLE `User` DISABLE KEYS */;
INSERT INTO `User` VALUES (1,'admin001','admin@psu.ac.th','$2b$10$jlPFOR4o4V5vPjfetRzsVusRquVvkPo13LFYAFgRxqIJgFmPKBIdW','System Administrator',NULL,'admin',1,'2026-02-09 07:34:02.950','2026-02-09 07:34:02.950',0,'IT Department',NULL,NULL,0,0,NULL,1,NULL),(2,NULL,'it2@psu.ac.th','$2b$10$B8a7gA3HlNvqZBTe4ABaWe9nOZJCVkgsau1CJ5dAvPuIKqypNYVgq','Somsri IT',NULL,'it_support',1,'2026-02-09 07:34:03.061','2026-02-09 07:34:03.061',0,'Software Support',NULL,'082-345-6789',0,0,NULL,1,NULL),(3,NULL,'it1@psu.ac.th','$2b$10$yJ99OFB4g2zjjy4kvmT1veKqYpsbAu7YrpX50XbkdToxgqXO0pmu2','Somchai IT',NULL,'it_support',1,'2026-02-09 07:34:03.061','2026-02-09 07:34:03.061',0,'Hardware Support',NULL,'081-234-5678',0,0,NULL,1,NULL),(4,'6610110001','user@psu.ac.th','$2b$10$IKGTs11zLNyxtylwCpIf8uufHYzbbriMLvQMYorAOlXx5UyvSkYFC','Test Student',NULL,'user',1,'2026-02-09 07:34:03.118','2026-02-09 07:34:03.118',0,NULL,NULL,NULL,0,0,NULL,1,NULL),(5,NULL,'6510210264@psu.ac.th','$2b$10$cvVjcX0D0AOV8jbjKvGkI.baxMhku9/eUx7Z2wMixdtTQSK7f3gDS',NULL,NULL,'user',1,'2026-02-09 08:03:30.926','2026-02-09 08:03:30.926',0,NULL,NULL,NULL,0,0,NULL,1,NULL),(6,NULL,'admin1@psu.ac.th','$2b$10$Wgn/qRC7jVTpRC.hO4JmH.B6eHpuUO1CazXyTyKHkXXW3WqVtL2MS',NULL,NULL,'admin',1,'2026-02-09 08:04:17.425','2026-02-09 08:04:17.425',0,NULL,NULL,NULL,0,0,NULL,1,NULL),(7,NULL,'pollawat.c@psu.ac.th','$2b$10$sP9/vWM5A0mp8PdpMeKJ7.7Q7J2DCLpbH90w4gvutNtax6RvX9AJK',NULL,NULL,'it_support',1,'2026-02-09 08:05:38.240','2026-02-09 09:04:55.781',0,NULL,NULL,NULL,0,0,'psuichelpdesk@gmail.com',1,'muna.lanke@gmail.com'),(8,NULL,'test_1770628028554@example.com','$2b$10$Xcjf9dqG6lqzXZEBHbLOEuG/JesZLAv4OQeQOnmfnD1WGW6YxLpb2',NULL,NULL,'user',1,'2026-02-09 09:07:08.635','2026-02-09 09:07:08.635',0,NULL,NULL,NULL,0,0,NULL,1,NULL),(9,NULL,'test_1770628078685@example.com','$2b$10$BFlv4XF5u1DAmxdtDwTbFOvNxrpJ3nNrPWwQEYTtmct0wonJ1fh.m',NULL,NULL,'user',1,'2026-02-09 09:07:58.780','2026-02-09 09:07:58.780',0,NULL,NULL,NULL,0,0,NULL,1,NULL),(10,NULL,'test_1770628100109@example.com','$2b$10$OblFVJU9cwCl7bgdrX6izOmUUsPWh9fJecF.jWBjvTbyo83UAiacC',NULL,NULL,'user',1,'2026-02-09 09:08:20.189','2026-02-09 09:08:20.189',0,NULL,NULL,NULL,0,0,NULL,1,NULL),(11,NULL,'login_test_1770628100195@example.com','$2b$10$IeFNpVwRAhz0PjmkJwp.fOXyN10Dqn8YQIDIsm3fbuc6jqk9DG4t2',NULL,NULL,'user',1,'2026-02-09 09:08:20.250','2026-02-09 09:08:20.250',0,NULL,NULL,NULL,0,0,NULL,1,NULL);
/*!40000 ALTER TABLE `User` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-02-09 21:52:03
