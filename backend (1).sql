-- MySQL dump 10.13  Distrib 8.0.21, for Win64 (x86_64)
--
-- Host: localhost    Database: oceanpower_cms
-- ------------------------------------------------------
-- Server version	8.0.21

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `cms_admin_sessions`
--

DROP TABLE IF EXISTS `cms_admin_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cms_admin_sessions` (
  `token_hash` char(64) NOT NULL,
  `username` varchar(80) NOT NULL,
  `csrf_token` char(43) NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`token_hash`),
  KEY `cms_admin_sessions_expiry_idx` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cms_admin_sessions`
--

LOCK TABLES `cms_admin_sessions` WRITE;
/*!40000 ALTER TABLE `cms_admin_sessions` DISABLE KEYS */;
INSERT INTO `cms_admin_sessions` VALUES ('07a52c1d37ed19353de251b86eb712a734f12e4e568cd971ee04da354f984d77','admin','lzyU-d6C-K7Y2kZjgKf2CMZJzFz5ucLCNq-AF_0GsZQ','2026-10-14 01:19:58','2026-10-13 09:19:58'),('ee642a6900593c385133bc9dbe55f16c2d61fdfdaaf9726e232196cced109840','admin','TDVtBCxky1P7gYaCD8FlKprwZ3_QbkZnW2EBPd3c9qc','2026-10-14 01:24:17','2026-10-13 09:24:17');
/*!40000 ALTER TABLE `cms_admin_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cms_entries`
--

DROP TABLE IF EXISTS `cms_entries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cms_entries` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `kind` enum('page','business','product','news','document') NOT NULL,
  `slug` varchar(160) NOT NULL,
  `status` enum('draft','published') NOT NULL DEFAULT 'draft',
  `sort_order` int NOT NULL DEFAULT '0',
  `published_at` datetime DEFAULT NULL,
  `featured_image_id` char(36) DEFAULT NULL,
  `attachment_id` char(36) DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `cms_entries_kind_slug_uq` (`kind`,`slug`),
  KEY `cms_entries_image_fk` (`featured_image_id`),
  KEY `cms_entries_attachment_fk` (`attachment_id`),
  KEY `cms_entries_public_idx` (`kind`,`status`,`sort_order`),
  CONSTRAINT `cms_entries_attachment_fk` FOREIGN KEY (`attachment_id`) REFERENCES `cms_files` (`id`) ON DELETE SET NULL,
  CONSTRAINT `cms_entries_image_fk` FOREIGN KEY (`featured_image_id`) REFERENCES `cms_files` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cms_entries`
--

LOCK TABLES `cms_entries` WRITE;
/*!40000 ALTER TABLE `cms_entries` DISABLE KEYS */;
INSERT INTO `cms_entries` VALUES (1,'page','home','draft',0,NULL,NULL,NULL,'{}','2026-10-13 09:13:20','2026-10-13 09:13:20'),(2,'page','about','draft',0,NULL,NULL,NULL,'{}','2026-10-13 09:13:20','2026-10-13 09:13:20'),(3,'page','contact','draft',0,NULL,NULL,NULL,'{\"fax\": \"+86 755 83300726 / 83300727 / 83300728\", \"hotline\": \"400-6686-126\", \"telephone\": \"+86 755 83300666\"}','2026-10-13 09:13:20','2026-10-13 09:13:20'),(4,'business','new-material','draft',0,NULL,NULL,NULL,'{\"label\": \"New materials\"}','2026-10-13 09:13:20','2026-10-13 09:13:20'),(5,'business','food','draft',0,NULL,NULL,NULL,'{\"label\": \"Food\"}','2026-10-13 09:13:20','2026-10-13 09:13:20'),(6,'business','environment','draft',0,NULL,NULL,NULL,'{\"label\": \"Environment\"}','2026-10-13 09:13:20','2026-10-13 09:13:20'),(7,'business','information','draft',0,NULL,NULL,NULL,'{\"label\": \"Information\"}','2026-10-13 09:13:20','2026-10-13 09:13:20'),(8,'product','fibre-reinforced-composites','draft',0,NULL,NULL,NULL,'{\"source\": \"http://www.opxincai.com/prod_view.aspx?TypeId=50032&Id=186&FId=t3:50032:3\", \"category\": \"Fibre-reinforced composites\"}','2026-10-13 09:13:20','2026-10-13 09:13:20'),(9,'product','asphalt-based-products','draft',0,NULL,NULL,NULL,'{\"source\": \"http://www.opxincai.com/prod_view.aspx?TypeId=50035&Id=191&FId=t3:50035:3\", \"category\": \"Asphalt-based products\"}','2026-10-13 09:13:20','2026-10-13 09:13:20'),(10,'product','cement-based-products','draft',0,NULL,NULL,NULL,'{\"source\": \"http://www.opxincai.com/prod_view.aspx?TypeId=50031&Id=185&FId=t3:50031:3\", \"category\": \"Cement-based products\"}','2026-10-13 09:13:20','2026-10-13 09:13:20'),(11,'product','safety-monitoring-systems','draft',0,NULL,NULL,NULL,'{\"source\": \"http://www.opxincai.com/prod_view.aspx?TypeId=50053&Id=206&FId=t3:50053:3\", \"category\": \"Safety monitoring systems\"}','2026-10-13 09:13:20','2026-10-13 09:13:20'),(12,'product','integrated-solutions','draft',0,NULL,NULL,NULL,'{\"source\": \"http://www.opxincai.com/prod_view.aspx?TypeId=50056&Id=383&FId=t3:50056:3\", \"category\": \"Integrated solutions\"}','2026-10-13 09:13:20','2026-10-13 09:13:20'),(13,'product','functional-additives','draft',0,NULL,NULL,NULL,'{\"source\": \"http://www.opxincai.com/prod_view.aspx?TypeId=50065&Id=380&FId=t3:50065:3\", \"category\": \"Functional additives products\"}','2026-10-13 09:13:20','2026-10-13 09:13:20'),(14,'product','colour-systems','draft',0,NULL,NULL,NULL,'{\"source\": \"http://www.opxincai.com/prod_view.aspx?TypeId=50061&Id=330&FId=t3:50061:3\", \"category\": \"Colour system products\"}','2026-10-13 09:13:20','2026-10-13 09:13:20'),(15,'document','frp-rebar-catalogue','draft',0,NULL,NULL,NULL,'{\"existingUrl\": \"/catalogue.pdf\"}','2026-10-13 09:13:20','2026-10-13 09:13:20');
/*!40000 ALTER TABLE `cms_entries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cms_files`
--

DROP TABLE IF EXISTS `cms_files`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cms_files` (
  `id` char(36) NOT NULL,
  `stored_name` varchar(255) NOT NULL,
  `original_name` varchar(255) NOT NULL,
  `mime_type` varchar(120) NOT NULL,
  `byte_size` int unsigned NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `stored_name` (`stored_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cms_files`
--

LOCK TABLES `cms_files` WRITE;
/*!40000 ALTER TABLE `cms_files` DISABLE KEYS */;
/*!40000 ALTER TABLE `cms_files` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cms_product_specs`
--

DROP TABLE IF EXISTS `cms_product_specs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cms_product_specs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `entry_id` bigint unsigned NOT NULL,
  `label_en` varchar(180) NOT NULL,
  `label_zh` varchar(180) NOT NULL,
  `value_text` varchar(255) NOT NULL,
  `unit` varchar(40) NOT NULL DEFAULT '',
  `source_reference` varchar(255) NOT NULL DEFAULT '',
  `sort_order` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `cms_specs_order_idx` (`entry_id`,`sort_order`),
  CONSTRAINT `cms_specs_entry_fk` FOREIGN KEY (`entry_id`) REFERENCES `cms_entries` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cms_product_specs`
--

LOCK TABLES `cms_product_specs` WRITE;
/*!40000 ALTER TABLE `cms_product_specs` DISABLE KEYS */;
/*!40000 ALTER TABLE `cms_product_specs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cms_sessions`
--

DROP TABLE IF EXISTS `cms_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cms_sessions` (
  `token_hash` char(64) NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `csrf_token` char(43) NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`token_hash`),
  KEY `cms_sessions_user_fk` (`user_id`),
  KEY `cms_sessions_expiry_idx` (`expires_at`),
  CONSTRAINT `cms_sessions_user_fk` FOREIGN KEY (`user_id`) REFERENCES `cms_users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cms_sessions`
--

LOCK TABLES `cms_sessions` WRITE;
/*!40000 ALTER TABLE `cms_sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `cms_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cms_translations`
--

DROP TABLE IF EXISTS `cms_translations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cms_translations` (
  `entry_id` bigint unsigned NOT NULL,
  `locale` enum('en','zh') NOT NULL,
  `title` varchar(255) NOT NULL DEFAULT '',
  `summary` text NOT NULL,
  `body` longtext NOT NULL,
  PRIMARY KEY (`entry_id`,`locale`),
  CONSTRAINT `cms_translations_entry_fk` FOREIGN KEY (`entry_id`) REFERENCES `cms_entries` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cms_translations`
--

LOCK TABLES `cms_translations` WRITE;
/*!40000 ALTER TABLE `cms_translations` DISABLE KEYS */;
INSERT INTO `cms_translations` VALUES (1,'en','Built for the elements.','Advanced fiber-reinforced polymer reinforcement for infrastructure exposed to corrosion, weight or magnetic constraints.',''),(1,'zh','Built for the elements.','面向严苛基础设施的高性能纤维增强聚合物筋材，解决腐蚀、重量和磁干扰难题。',''),(2,'en','Oceanpower Group','Technology, people and responsible development connect Oceanpower\'s businesses.','Group overview\n\nHeadquartered in Shenzhen, Oceanpower brings together research, manufacturing and technical services. Its group profile describes research centres in Shenzhen and Shanghai and production capabilities in Guangdong and Shanghai, serving advanced construction materials, water treatment, transport and digital colour applications.\n\nAlongside the four company profiles in Business, the group presentation covers industrial investment, intelligent water systems, transport infrastructure, energy and commodities, supply-chain cooperation and social responsibility. These activities connect research with practical applications and industry services.\n\nWider group activities\n\nIndustrial investment supports materials development and production. Intelligent water systems apply modelling and automated control to treatment operations. Transport infrastructure work includes coloured asphalt, recycled asphalt and additives for road performance.\n\nEnergy and commodities activities cover coal, iron ore, non-ferrous metals and logistics. Supply-chain cooperation supports policy research, training, standards, branding and industry exchange. Social responsibility includes public-interest standardisation and community service; the profile also describes employee participation through the company\'s Party organisation.\n\nCeo Message\n\nOur motivation to strive is:\n\n\"Solution Innovation For Today And Tomorrow\"\n\nIt is a privilege for me to introduce you about our company, OCEANPOWER COPORATION.\n\nIn a world where continuous change is a reality, business is challenged to leverage upon new, complex and expensive technologies for enhancing their competitive edge and ensuring their growth. Helping customers through this challenge is OCEANPOWER\'s business.\n\nOCEANPOWER helps customers leverage upon the right business processes and solutions to achieve business objectives. We have always identified emerging shifts in technology, and provided our customer with Chinese government support.\n\nIn a large corporation or a small enterprise, the success of your business is very important to us. We will work hard for you to earn your trust.We constantly invite solution for “today\'s and tomorrow\'s world”\n\nCorporate culture\n\nOceanpower views its culture as a shared asset that develops through the work of its subsidiaries. Values are reflected in management, service, strategy and everyday practice.\n\nThe company encourages teamwork, perseverance, enthusiasm and personal development. Employee activities and physical exercise support cooperation and wellbeing, while continued learning strengthens the organisation.\n\nEnvironmental policy\n\nEnvironmental responsibility is part of Oceanpower\'s business operations and applies to employees, the workplace and the wider community. Product and project decisions consider environmental effects, and suppliers and subcontractors are encouraged to provide responsible products.\n\nThe policy calls for compliance with environmental laws, less waste and discharge, improved processes, and efficient use of energy, natural resources and recycled materials. Environmental management should cover new developments and improve continuously with leadership involvement and employee participation.\n\nTraining, emergency preparedness, recognition of employee contributions and open dialogue with external organisations support this commitment. Oceanpower welcomes feedback on its environmental performance.'),(2,'zh','海川集团','科技、人才与负责任的发展，连接海川各项业务。','集团概况\n\n海川总部位于深圳，集研发、制造与技术服务于一体。集团简介介绍了深圳和上海的研发中心，以及广东和上海的生产能力，服务于先进建筑材料、水处理、交通和数字色彩应用领域。\n\n除业务页面的四家公司简介外，集团介绍还涵盖产业投资、智慧水务、交通基础设施、能源与大宗商品、供应链合作及社会责任，将科研与实际应用和行业服务相结合。\n\n集团其他业务\n\n产业投资支持材料研发和生产。智慧水务将建模与自动控制应用于处理运行。交通基础设施业务包括彩色沥青、再生沥青及改善道路性能的添加剂。\n\n能源与大宗商品业务涵盖煤炭、铁矿石、有色金属和物流。供应链合作支持政策研究、培训、标准、品牌建设与行业交流。社会责任包括公益性标准化和社区服务；简介还介绍了员工通过公司党组织参与相关活动。\n\n总裁寄语\n\n我们努力奋斗的动力是：\n\n“为今天和明天提供创新解决方案”\n\n我很荣幸向您介绍我们的公司——海川集团。\n\n在不断变化的世界中，企业面临着运用新颖、复杂且成本高昂的技术来增强竞争力、确保增长的挑战。帮助客户应对这一挑战，正是海川的业务。\n\n海川帮助客户运用合适的业务流程与解决方案，实现业务目标。我们始终关注技术领域的新变化，并为客户提供中国政府的支持。\n\n无论您来自大型公司还是小型企业，您的业务成功对我们都十分重要。我们将努力工作，赢得您的信任。我们不断寻求面向“今天与明天的世界”的解决方案。\n\n企业文化\n\n海川将企业文化视为共同资产，在各子公司的实践中不断发展。价值理念融入管理、服务、战略和日常工作。\n\n公司鼓励团队合作、坚韧进取、工作热情和个人发展。员工活动与体育锻炼促进协作和身心健康，持续学习增强组织能力。\n\n环境方针\n\n环境责任是海川经营活动的一部分，涉及员工、工作场所和社会。产品与项目决策考虑环境影响，并鼓励供应商与分包商提供负责任的产品。\n\n方针要求遵守环境法律，减少废弃物与排放，改进工艺，提高能源、自然资源和再生材料的利用效率。环境管理应覆盖新开发项目，在管理层参与和员工共同努力下持续完善。\n\n培训、应急准备、表彰员工贡献以及与外部组织公开交流，共同支持这一承诺。海川欢迎对其环境表现提出意见。'),(3,'en','Group headquarters','For group-level enquiries, the original Oceanpower website lists the following headquarters details.','Shenzhen headquarters\n\nBlocks C and D, 7th and 8th floors, Building F3.8, Tian\'an Industrial Development Area, Chegongmiao, Shenzhen, China. Postal code: 518040.'),(3,'zh','集团总部','原海川网站列出了以下总部信息，供集团业务咨询参考。','深圳总部\n\n中国深圳市车公庙天安工业区F3.8栋7、8楼C、D座。邮政编码：518040。'),(4,'en','OCEANPOWER New Material Technology Co., Ltd.','Civil engineering materials, advanced coatings, new polymers and digital colour technology for sustainable construction.','Company overview\n\nOCEANPOWER New Material Technology Co., Ltd. has a registered capital of 3,333 million Chinese yuan and two divisions: Civil Engineering Materials and Coating New Materials. Its production centres are located in Pudong, Shanghai (50,000 square metres) and Heyuan, Guangdong (100,000 square metres). The company has 56 offices and branches across China\'s main provinces and selected regions around the world.\n\nTechnology and innovation\n\nThrough national scientific and technological support projects and its standardisation strategy, OCEANPOWER develops its capabilities in original and strategic innovation. Its work includes breakthroughs in low-carbon materials, land and material conservation, energy saving and water saving. Its products and services have received certifications from relevant authorities and have been used in major projects in China.\n\nWith technology and innovation at the core of its business philosophy, the company provides low-carbon engineering materials, new polymer materials, and personalised products and services in digital colour technology. These include integrated coatings and colour solutions designed to create value together with customers.\n\nBy bringing together its resources and strengths, OCEANPOWER seeks further advances in products and services and opportunities to participate in domestic and international capital markets.\n\nPurpose and responsibility\n\nOur pursuit is to provide sustainable solutions. Our ambition is to embrace challenges, pursue self-improvement, serve the community and create the future.\n\nOur responsibility is to create wealth for society, value for customers, profits for shareholders and opportunities for employees.\n\nOCEANPOWER works with new and existing customers to contribute to scientific development and economic restructuring, with the ambition of becoming a leader in the development of new materials in China.'),(4,'zh','海川新材料科技有限公司','提供土木工程材料、先进涂料、新型聚合物及数字色彩技术，助力可持续建设。','公司概况\n\n海川新材料科技有限公司注册资本为33.33亿元人民币，下设土木工程材料事业部和涂料新材料事业部。公司在上海浦东和广东河源设有生产中心，占地面积分别为50,000平方米和100,000平方米，并在中国主要省份及世界部分地区设有56个办事处和分支机构。\n\n科技与创新\n\n海川通过实施国家科技支撑项目和标准化战略，提升自主创新与战略创新能力，在低碳材料、节地节材、节能和节水等方面取得突破。产品与服务多次获得相关权威机构认证，并广泛应用于中国重点工程。\n\n公司以科技和创新为核心经营理念，为客户提供低碳工程材料、新型聚合物材料，以及数字色彩技术领域的个性化产品与服务，包括涂料与色彩一体化解决方案，与客户共同创造价值。\n\n海川通过整合资源与优势，推动产品和服务持续突破，并积极寻求参与国内外资本市场的机会。\n\n使命与责任\n\n提供可持续解决方案是我们的追求。迎接挑战、自强不息、服务社会、创造未来是我们的志向。\n\n为社会创造财富、为客户创造价值、为股东创造利润、为员工创造机会，是我们的责任。\n\n海川携手新老客户，为科学发展和经济转型作出贡献，致力于成为中国新材料发展领域的领先企业。'),(5,'en','Shenzhen OCEANPOWER Food Technology Co., Ltd.','Soft ice cream machines, ice cream powder and food technology, combining equipment manufacturing with research and service.','Company overview\n\nFounded in 1996, Shenzhen OCEANPOWER Food Technology Co., Ltd. is a subsidiary of Shenzhen OCEANPOWER Industry Co., Ltd. Its main products are soft ice cream machines, ice cream powder and other healthy foods.\n\nOCEANPOWER has built its reputation on reliable soft ice cream machines and manufacturing management, serving markets around the world.\n\nFood safety and manufacturing\n\nSince 1996, the company has used advanced manufacturing technologies to meet safety, health and environmental requirements. Materials used in its food machinery include SUS304 stainless steel, ABS and POM plastic consumable parts, and silicone rubber packing and gaskets.\n\nThe company profile describes OCEANPOWER as China\'s largest professional manufacturer of soft ice cream machines and ice cream powder. It lists CE, CB, NSF, LET, UL, RoHS, GOST and GS certifications, together with HACCP practices, ISO14001 environmental certification and SGS ISO9001 quality certification for the company and its production line.\n\nResearch and international reach\n\nFollowing decades of development, more than 70 branch offices have been established in China and abroad. The company invests in research and development and cooperates with universities and research institutions. It has obtained more than 20 national patents and was authorised by the Standardization Administration of China to set national standards for soft ice cream machines and powder in 2005.\n\nIts products serve Southeast Asia, the Middle East, South America, Europe, Oceania and Africa. Guided by Quality, Service and Reputation, OCEANPOWER continues to meet challenges and develop its business for the future.'),(5,'zh','深圳市海川食品科技有限公司','融合设备制造、研发与服务，提供软冰淇淋机、冰淇淋粉及食品技术。','公司概况\n\n深圳市海川食品科技有限公司成立于1996年，是深圳市海川实业股份有限公司的子公司，主要经营软冰淇淋机、冰淇淋粉及其他健康食品。\n\n海川凭借可靠的软冰淇淋机和制造管理体系建立声誉，服务全球市场。\n\n食品安全与制造\n\n自1996年以来，公司采用先进制造技术，满足安全、健康和环保要求。食品机械使用的材料包括SUS304不锈钢、ABS和POM塑料易耗件，以及硅橡胶填料和密封垫。\n\n公司简介将海川列为中国最大的软冰淇淋机和冰淇淋粉专业制造商，并列明CE、CB、NSF、LET、UL、RoHS、GOST及GS认证，以及公司和生产线所遵循的HACCP体系、ISO14001环境认证和SGS颁发的ISO9001质量认证。\n\n研发与国际市场\n\n经过数十年发展，公司在国内外设立了70多个分支办事处，持续投入研发，并与高校和科研机构合作。公司已获得20多项国家专利，并于2005年获国家标准化管理委员会授权，制定软冰淇淋机和冰淇淋粉的国家标准。\n\n产品销往东南亚、中东、南美洲、欧洲、大洋洲和非洲。海川秉持质量、服务、信誉的原则，不断迎接挑战，推动未来发展。'),(6,'en','Shenzhen OCEANPOWER Environmental Technology Co., Ltd.','UV disinfection, membrane technology and water reuse solutions for municipal drinking water and wastewater treatment.','Water safety and engineering\n\nShenzhen OCEANPOWER Environmental Technology Co., Ltd. is committed to water safety. It designs, manufactures and sells UV disinfection and sewage reuse systems for municipal wastewater and drinking water treatment, with services covering engineering design, project contracting and technical support.\n\nThrough continuous innovation, the company has built a professional team with product development capabilities, engineering experience and after-sales service.\n\nStandards and cooperation\n\nOCEANPOWER developed the national standard GB/T19837—2005, Ultraviolet (UV) disinfection equipment for municipal water and wastewater treatment. Its company profile identifies it as the standing secretariat department of National Technical Committee 299 on Ultraviolet Disinfection of the Standardization Administration of China, a major member of the national environmental products technical committee and a council member of the International Ultraviolet Association (IUVA).\n\nThe company offers cooperation from design consulting to project financing and undertakes projects supported by organisations including the World Bank, Asian Development Bank and United Nations Industrial Development Organization. It also researches and promotes technologies for municipal water treatment, particularly water and wastewater disinfection.\n\nUV disinfection and membrane technology\n\nGuided by Safety Comes First, OCEANPOWER develops safe, advanced and cost-effective UV treatment solutions. It maintains strategic cooperation with leading membrane technology suppliers to research wastewater treatment, advanced treatment, water reuse and zero liquid discharge systems and equipment.\n\nThe company profile lists ISO9001 quality certification and ISO 14000 environmental management certification, as well as product authentications from NSF, NWRI, USEPA and CE. It describes cooperation with universities, research institutes and design institutes on water quality and safety solutions, and a post-doctoral research centre approved by the Ministry of Personnel. It also reports recognition as a leading national patent enterprise for three consecutive years.\n\nProjects and support\n\nMore than 60 branch offices and subsidiaries in China and abroad provide technical support and after-sales service.\n\nThe supplied company profile reports that more than 400 large and medium-sized wastewater treatment plants use OCEANPOWER technology and products, with more than 60% of China\'s wastewater disinfection market. It highlights Shanghai Bailonggang WWTP, with a treatment capacity of 2.6 million cubic metres per day, as the world\'s largest UV disinfection system at the time of the profile.\n\nOCEANPOWER aims to become a leader in the global UV disinfection industry and contribute to environmental protection.'),(6,'zh','深圳市海川环境科技有限公司','为市政饮用水和污水处理提供紫外线消毒、膜技术及水回用解决方案。','水安全与工程服务\n\n深圳市海川环境科技有限公司致力于水安全领域，设计、制造和销售用于市政污水及饮用水处理的紫外线消毒与污水回用系统，服务涵盖工程设计、项目承包和技术支持。\n\n通过持续创新，公司建立了具备产品研发能力、丰富工程经验和售后服务能力的专业团队。\n\n标准与合作\n\n海川制定了国家标准GB/T19837—2005《城镇给排水紫外线消毒设备》。公司简介记载，海川是国家标准化管理委员会全国紫外线消毒标准化技术委员会（TC299）秘书处的常设部门、全国环保产品标准化技术委员会的主要成员单位，以及国际紫外线协会（IUVA）的理事单位。\n\n公司提供从设计咨询到项目融资的合作服务，承接世界银行、亚洲开发银行和联合国工业发展组织等机构支持的项目，并开展市政水处理技术研究和推广，尤其专注于给水及污水消毒。\n\n紫外线消毒与膜技术\n\n海川坚持安全第一，开发安全、先进且具成本效益的紫外线处理方案，并与领先膜技术供应商保持战略合作，共同研究污水处理、深度处理、水回用及零液体排放系统与设备。\n\n公司简介列明ISO9001质量认证、ISO 14000环境管理认证，以及NSF、NWRI、USEPA和CE等产品认证。公司与高校、科研院所和设计单位合作研究水质安全解决方案，设有人事部批准的博士后科研工作站，并记载连续三年获得国家级专利领先企业认可。\n\n项目与支持\n\n国内外60多个办事处和子公司为客户提供技术支持与售后服务。\n\n所提供的公司简介记载，400多座大中型污水处理厂采用海川技术和产品，其在中国污水消毒市场的占有率超过60%。简介重点介绍了日处理能力260万立方米的上海白龙港污水处理厂，并称其在该简介发布时拥有全球最大的紫外线消毒系统。\n\n海川致力于成为全球紫外线消毒行业的领先企业，为环境保护作出贡献。'),(7,'en','Shenzhen OCEANPOWER Information Technology Co., Ltd.','Software development, system integration, digital colour tools and industry information platforms for construction and coatings.','Company overview\n\nShenzhen OCEANPOWER Information Technology Co., Ltd. is a high-tech company directly under Oceanpower Group. It specialises in software development, system integration and information technology consulting for construction engineering and chemical coatings.\n\nDigital colour and industry software\n\nWith a strong technology research and development team, the company develops management software and e-commerce application solutions for chemical businesses. Its building colour solutions include the China Building Color Digital Color Card, Oceanpower Building Color Creative Design Software and professional colour management software, addressing gaps in China\'s industry.\n\nDrawing on its technical capabilities and industry experience, the company developed an emulsion, pigments and fillers database query system. It provides manufacturer information and product data to support reliable technical product selection.\n\nIndustry platforms and partnerships\n\nThe company develops and operates China Coating Online, China Asphalt Web and China Recycled Asphalt, providing service platforms for the coatings and asphalt industries.\n\nAs an early industry portal, China Coating Online maintains relationships with government departments and organisations including China\'s Ministry of Chemical Industry, the Science and Technology Division of the Ministry of Construction, and the Architectural Coatings Engineering Research Center of the Ministry of Construction.\n\nIt also builds long-term partnerships with the China Coating Industry Association, Changzhou Coating Chemical Institute, Lanzhou Chemical Institute, universities, colleges and research institutions to share resources and pursue development together.'),(7,'zh','深圳市海川信息科技有限公司','面向建筑和涂料行业，提供软件开发、系统集成、数字色彩工具及行业信息平台。','公司概况\n\n深圳市海川信息科技有限公司是海川集团直属高科技企业，专注于为建筑工程和化工涂料领域提供软件开发、系统集成及信息技术咨询服务。\n\n数字色彩与行业软件\n\n公司拥有强大的技术研发团队，为化工企业开发管理软件和电子商务应用解决方案。建筑色彩解决方案包括中国建筑色彩数字色卡、海川建筑色彩创意设计软件及专业色彩管理软件，填补了中国相关行业的空白。\n\n凭借技术能力和行业经验，公司开发了乳液、颜料及填料数据库查询系统，提供制造商信息与产品数据，为用户可靠地选择产品提供技术依据。\n\n行业平台与合作伙伴\n\n公司开发并运营中国涂料在线、中国沥青网和中国再生沥青，为涂料与沥青行业提供服务平台。\n\n作为较早建立的行业门户之一，中国涂料在线与中国化学工业部、建设部科技司及建设部建筑涂料工程研究中心等政府部门和机构保持联系。\n\n公司还与中国涂料工业协会、常州涂料化工研究院、兰州化工研究院，以及高校和科研机构建立长期合作关系，共享资源、携手发展。'),(8,'en','Fibre-reinforced composites','',''),(8,'zh','纤维增强复合材料','',''),(9,'en','Asphalt-based products','',''),(9,'zh','沥青基产品','',''),(10,'en','Cement-based products','',''),(10,'zh','水泥基产品','',''),(11,'en','Safety monitoring systems','',''),(11,'zh','安全监测系统','',''),(12,'en','Integrated solutions','',''),(12,'zh','解决方案','',''),(13,'en','Functional additives products','',''),(13,'zh','功能助剂产品','',''),(14,'en','Colour system products','',''),(14,'zh','色彩系统产品','',''),(15,'en','FRP Rebar Catalog','Oceanpower product and company catalogue.',''),(15,'zh','FRP 筋材产品目录','Oceanpower 产品与公司资料目录。','');
/*!40000 ALTER TABLE `cms_translations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cms_users`
--

DROP TABLE IF EXISTS `cms_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cms_users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `username` varchar(80) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cms_users`
--

LOCK TABLES `cms_users` WRITE;
/*!40000 ALTER TABLE `cms_users` DISABLE KEYS */;
/*!40000 ALTER TABLE `cms_users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-14  9:42:51
