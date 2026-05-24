"""seed knowledge chapters, cards, and questions

Revision ID: 0003_seed_content
Revises: 0002_seed_domains
Create Date: 2026-05-22 08:00:00.000000
"""
from alembic import op

revision = "0003_seed_content"
down_revision = "0002_seed_domains"
branch_labels = None
depends_on = None


def escape(val):
    if val is None:
        return "NULL"
    return "'" + str(val).replace("'", "''") + "'"


# ===========================
#  Content Data
# ===========================

# K01 编程基础概念
K01 = {
    "编程基础概念": [
        {
            "chapter": "变量与数据类型",
            "cards": [
                {
                    "title": "什么是变量",
                    "concept": "变量是存储数据的命名容器",
                    "detail": "变量是编程中最基本的概念之一。它就像是一个贴了标签的盒子，每个盒子可以存放特定类型的数据。通过变量名，我们可以方便地存取和操作数据。",
                    "analogy": "变量就像你书桌上贴着标签的收纳盒。标签就是变量名，盒子里装的东西就是数据。你可以随时查看盒子里的内容（读取），也可以替换成新的内容（赋值）。",
                    "tags": '["变量", "存储", "基础"]',
                    "difficulty": "beginner",
                    "question": {
                        "text": "在编程中，变量最主要的作用是什么？",
                        "options": '{"A":"让代码运行更快","B":"存储和操作数据","C":"显示文字","D":"连接网络"}',
                        "answer": "B",
                        "explanation": "变量用于在内存中存储和操作数据。通过变量名可以方便地存取数据，这是编程的基础。"
                    }
                },
                {
                    "title": "基本数据类型",
                    "concept": "常见的基本数据类型有整型、浮点型、布尔型和字符串",
                    "detail": "基本数据类型是编程语言内置的最基础的数据表示形式。整数（int）表示整数值，浮点数（float）表示小数，布尔值（bool）表示真/假，字符串（str）表示文本。",
                    "analogy": "数据类型就像不同规格的容器——整数是只能放整块积木的盒子，浮点数是可以放半块积木的盒子，布尔值是只有「有」或「无」两个状态的开关，字符串是用来写字的纸条。",
                    "tags": '["数据类型", "基础", "必知"]',
                    "difficulty": "beginner",
                    "question": {
                        "text": "以下哪个不是常见的基本数据类型？",
                        "options": '{"A":"整数 (int)","B":"浮点数 (float)","C":"数组 (array)","D":"布尔值 (bool)"}',
                        "answer": "C",
                        "explanation": "数组（array）属于复合数据类型，而整数、浮点数、布尔值和字符串是基本数据类型。"
                    }
                },
                {
                    "title": "类型转换",
                    "concept": "类型转换是将数据从一种类型转换为另一种类型的过程",
                    "detail": "类型转换分为隐式转换和显式转换。隐式转换由编程语言自动完成，例如整数和浮点数运算时整数会自动转为浮点数。显式转换需要开发者手动调用转换函数，例如 int('123') 将字符串转为整数。",
                    "analogy": "类型转换就像国际旅行时换钱——隐式转换就像有些商店直接接受外币（自动处理），显式转换就像你去银行柜台明确说「我要把100美元换成人民币」（手动调用函数）。",
                    "tags": '["类型转换", "进阶"]',
                    "difficulty": "beginner",
                    "question": {
                        "text": "执行 int('42') 的结果是什么？",
                        "options": '{"A":"\'42\'","B":"42","C":"报错","D":"\'24\'"}',
                        "answer": "B",
                        "explanation": "int('42') 将字符串 '42' 显式转换为整数 42，这是字符串转整数的标准用法。"
                    }
                }
            ]
        },
        {
            "chapter": "控制流程",
            "cards": [
                {
                    "title": "条件语句",
                    "concept": "条件语句让程序根据不同条件执行不同的代码分支",
                    "detail": "条件语句（if-else）是编程中最基础的控制结构。它根据条件表达式的真假来决定执行哪段代码。常见的模式包括：if、if-else、if-elif-else 多分支结构。",
                    "analogy": "条件语句就像十字路口的交通信号灯——如果绿灯亮了（条件为真），就直行通过（执行一段代码）；否则就停车等待（执行另一段代码）。",
                    "tags": '["条件", "控制流", "基础"]',
                    "difficulty": "beginner",
                    "question": {
                        "text": "以下哪个关键字用于在 Python 中编写条件语句？",
                        "options": '{"A":"for","B":"while","C":"if","D":"def"}',
                        "answer": "C",
                        "explanation": "if 是 Python 中条件语句的关键字，for 和 while 是循环关键字，def 是定义函数的关键字。"
                    }
                },
                {
                    "title": "循环结构",
                    "concept": "循环结构让程序重复执行某段代码直到满足特定条件",
                    "detail": "循环是编程中的重要控制结构。for 循环用于遍历可迭代对象（如列表、字符串），while 循环在条件为真时持续执行。使用 break 可以提前退出循环，continue 可以跳过当前迭代。",
                    "analogy": "循环就像跑步机——你上去后（进入循环），它会持续运转（重复执行代码），直到你按下停止按钮（条件不再满足）或者够时间了主动跳下来（break）。",
                    "tags": '["循环", "控制流"]',
                    "difficulty": "beginner",
                    "question": {
                        "text": "以下哪个语句可以立即退出当前循环？",
                        "options": '{"A":"continue","B":"exit","C":"break","D":"stop"}',
                        "answer": "C",
                        "explanation": "break 语句用于立即退出当前循环。continue 则是跳过当前迭代继续下一次循环。"
                    }
                }
            ]
        }
    ]
}

# K02 计算机网络基础
K02 = {
    "计算机网络基础": [
        {
            "chapter": "网络基础概念",
            "cards": [
                {
                    "title": "OSI七层模型",
                    "concept": "OSI七层模型将网络通信划分为7个层次",
                    "detail": "OSI（开放系统互联）模型从下到上依次为：物理层、数据链路层、网络层、传输层、会话层、表示层、应用层。每层负责不同的通信功能，层与层之间通过接口通信。",
                    "analogy": "OSI七层模型就像一家连锁餐厅的总部到分店的配送流程：物理层是送货的卡车，链路层是包装盒上的地址标签，网络层是导航路线规划，传输层是确保包裹不丢失的签收单。",
                    "tags": '["OSI", "网络模型", "基础"]',
                    "difficulty": "intermediate",
                    "question": {
                        "text": "OSI七层模型中，IP协议工作在哪一层？",
                        "options": '{"A":"物理层","B":"数据链路层","C":"网络层","D":"传输层"}',
                        "answer": "C",
                        "explanation": "IP协议工作在网络层（第三层），负责数据包的路由和转发。TCP协议工作在传输层（第四层）。"
                    }
                },
                {
                    "title": "TCP/IP四层模型",
                    "concept": "TCP/IP模型是因特网实际使用的网络模型",
                    "detail": "TCP/IP模型比OSI更简化，分为四层：网络接口层、网络层（IP）、传输层（TCP/UDP）、应用层（HTTP/FTP等）。这是互联网实际使用的协议栈。",
                    "analogy": "TCP/IP模型像快递寄送：应用层是你填写的快递单（内容），传输层是快递公司的小哥（确保送达），网络层是分拣中心的分发路线，网络接口层是送货的交通工具。",
                    "tags": '["TCP/IP", "网络", "协议"]',
                    "difficulty": "intermediate",
                    "question": {
                        "text": "TCP和UDP协议工作在哪一层？",
                        "options": '{"A":"网络接口层","B":"网络层","C":"传输层","D":"应用层"}',
                        "answer": "C",
                        "explanation": "TCP和UDP都属于传输层协议。TCP提供可靠连接，UDP提供高效无连接服务。"
                    }
                }
            ]
        },
        {
            "chapter": "HTTP协议",
            "cards": [
                {
                    "title": "HTTP请求方法",
                    "concept": "HTTP定义了多种请求方法用于不同的操作目的",
                    "detail": "最常用的HTTP方法有：GET（获取资源）、POST（创建资源）、PUT（更新资源）、DELETE（删除资源）、PATCH（部分更新）。GET是幂等的，POST不是。",
                    "analogy": "HTTP方法就像你对服务员下达的不同指令：GET是「看一下菜单」（读取），POST是「点一道新菜」（创建），PUT是「把这道菜换成另一道」（整体替换），DELETE是「把这盘菜撤走」（删除）。",
                    "tags": '["HTTP", "请求", "REST"]',
                    "difficulty": "intermediate",
                    "question": {
                        "text": "以下哪个HTTP方法是幂等的？",
                        "options": '{"A":"POST","B":"GET","C":"PATCH","D":"DELETE"}',
                        "answer": "B",
                        "explanation": "GET是幂等的，多次请求返回相同结果。POST每次可能创建新资源，所以不幂等。"
                    }
                },
                {
                    "title": "HTTP状态码",
                    "concept": "HTTP状态码表示服务器对请求的处理结果",
                    "detail": "状态码分为5类：1xx信息、2xx成功（200 OK、201 Created）、3xx重定向（301、302）、4xx客户端错误（400 Bad Request、401 Unauthorized、404 Not Found）、5xx服务器错误（500 Internal Server Error）。",
                    "analogy": "HTTP状态码就像快递的物流状态：200是「已签收」、301是「地址变更，请重新寄送」、404是「查无此地址」、500是「快递站着火了，你的包裹可能没了」。",
                    "tags": '["HTTP", "状态码", "调试"]',
                    "difficulty": "beginner",
                    "question": {
                        "text": "HTTP 404 状态码表示什么？",
                        "options": '{"A":"服务器错误","B":"资源未找到","C":"请求成功","D":"无权限访问"}',
                        "answer": "B",
                        "explanation": "404 Not Found 表示服务器无法找到请求的资源。这是最常见的客户端错误状态码之一。"
                    }
                }
            ]
        }
    ]
}

# K03 软件工程流程
K03 = {
    "软件工程流程": [
        {
            "chapter": "开发流程",
            "cards": [
                {
                    "title": "瀑布模型",
                    "concept": "瀑布模型将软件开发分为顺序执行的多个阶段",
                    "detail": "瀑布模型是最经典的软件开发模型，按顺序经历：需求分析→设计→实现→测试→部署→维护。每个阶段完成后才能进入下一阶段，回溯成本高。",
                    "analogy": "瀑布模型就像建造一栋房子——必须先打好地基（需求），然后搭框架（设计），再砌墙装修（实现），最后验收（测试）。你不能在装修完后再去改地基，代价太大了。",
                    "tags": '["瀑布模型", "开发流程", "传统"]',
                    "difficulty": "beginner",
                    "question": {
                        "text": "瀑布模型的最大缺点是什么？",
                        "options": '{"A":"开发速度太慢","B":"难以应对需求变更","C":"需要太多人","D":"不适合大型项目"}',
                        "answer": "B",
                        "explanation": "瀑布模型的阶段之间缺乏灵活性，后期发现需求问题需要回溯到早期阶段，变更成本非常高。"
                    }
                },
                {
                    "title": "敏捷开发",
                    "concept": "敏捷开发强调迭代开发、快速反馈和持续交付",
                    "detail": "敏捷开发通过短周期（通常2周）的迭代来交付功能，每个迭代包含完整的计划、开发、测试、回顾。Scrum是最流行的敏捷框架，包含Sprint、每日站会、评审会等实践。",
                    "analogy": "敏捷开发就像做一桌宴席，但不是先全部计划好再开始做——而是先做一道前菜端上来（第一个迭代），根据客人的反馈（评审），再做第二道主菜（下一个迭代），不断调整直到大家都满意。",
                    "tags": '["敏捷", "Scrum", "开发流程"]',
                    "difficulty": "intermediate",
                    "question": {
                        "text": "Scrum 中一个开发周期通常叫什么？",
                        "options": '{"A":"阶段","B":"Sprint","C":"里程碑","D":"版本"}',
                        "answer": "B",
                        "explanation": "Scrum 中固定长度的开发周期称为 Sprint，通常为2周，结束后交付可用的产品增量。"
                    }
                }
            ]
        },
        {
            "chapter": "代码管理",
            "cards": [
                {
                    "title": "Git基础",
                    "concept": "Git是分布式版本控制系统，用于追踪代码变更",
                    "detail": "Git记录了文件的每一次修改历史，支持多人协作。核心概念包括：仓库（Repository）、提交（Commit）、分支（Branch）、远程仓库（Remote）。基本工作流：clone → add → commit → push。",
                    "analogy": "Git就像游戏的存档系统——每次 commit 就像保存一个游戏进度。如果玩坏了（代码出 bug），可以随时读档回退到之前的进度。而分支就像创建不同结局的存档路线。",
                    "tags": '["Git", "版本控制", "工具"]',
                    "difficulty": "beginner",
                    "question": {
                        "text": "Git 中哪个命令用于保存当前更改到本地仓库？",
                        "options": '{"A":"git push","B":"git pull","C":"git commit","D":"git clone"}',
                        "answer": "C",
                        "explanation": "git commit 将暂存区中的更改保存到本地仓库的历史记录中。git push 则是将本地提交推送到远程仓库。"
                    }
                },
                {
                    "title": "分支策略",
                    "concept": "分支策略定义了团队如何使用Git分支进行协作开发",
                    "detail": "常见的分支策略包括：Git Flow（master/develop/feature/release/hotfix）、GitHub Flow（feature分支→PR合并到main）、Trunk-Based Development（小批量频繁合并到主干）。",
                    "analogy": "分支策略就像餐厅后厨的分工：主厨（main分支）负责最终出品，各个厨师（feature分支）在自己的工作台上准备不同的菜品，完成后经主厨检查（Code Review）才能上桌（合并到主分支）。",
                    "tags": '["Git", "分支", "协作"]',
                    "difficulty": "intermediate",
                    "question": {
                        "text": "Pull Request（PR）的主要目的是什么？",
                        "options": '{"A":"下载代码","B":"提交代码前进行代码审查","C":"备份代码","D":"部署到服务器"}',
                        "answer": "B",
                        "explanation": "PR 用于在合并代码到主分支之前进行代码审查，确保代码质量，发现潜在问题。"
                    }
                }
            ]
        }
    ]
}

# K04 数据库基础
K04 = {
    "数据库基础": [
        {
            "chapter": "SQL基础",
            "cards": [
                {
                    "title": "SELECT查询",
                    "concept": "SELECT语句用于从数据库中检索数据",
                    "detail": "SELECT是最常用的SQL语句。基本语法：SELECT 列名 FROM 表名 WHERE 条件。支持ORDER BY排序、GROUP BY分组、HAVING过滤分组、LIMIT限制返回条数等。",
                    "analogy": "SELECT就像图书馆的检索系统——你告诉管理员「我想要所有2023年出版的计算机类书籍」（SELECT + WHERE），管理员在书架上找到并拿给你。ORDER BY就像「按出版日期排好」。",
                    "tags": '["SQL", "查询", "数据库"]',
                    "difficulty": "beginner",
                    "question": {
                        "text": "SQL 中 ORDER BY 子句的作用是什么？",
                        "options": '{"A":"过滤数据","B":"排序结果","C":"分组统计","D":"限制行数"}',
                        "answer": "B",
                        "explanation": "ORDER BY 用于对查询结果进行排序，默认为升序（ASC），可以指定 DESC 降序。"
                    }
                },
                {
                    "title": "JOIN连接",
                    "concept": "JOIN用于将多个表中的数据按关联字段组合起来",
                    "detail": "常见JOIN类型：INNER JOIN（只返回匹配的行）、LEFT JOIN（返回左表所有行）、RIGHT JOIN（返回右表所有行）、FULL JOIN（返回所有行）。ON子句指定关联条件。",
                    "analogy": "JOIN就像把两张前后不一致的班级名单合并成一张完整名单。INNER JOIN是只找在两个名单上都有的学生，LEFT JOIN是保留第一张名单上的所有人，第二张有匹配的就补上。",
                    "tags": '["SQL", "JOIN", "关联查询"]',
                    "difficulty": "intermediate",
                    "question": {
                        "text": "INNER JOIN 和 LEFT JOIN 的主要区别是什么？",
                        "options": '{"A":"没有区别","B":"INNER JOIN 只返回匹配的行","C":"LEFT JOIN 只返回右表数据","D":"LEFT JOIN 更慢"}',
                        "answer": "B",
                        "explanation": "INNER JOIN 只返回两个表中匹配的行。LEFT JOIN 返回左表所有行，右表无匹配时填充 NULL。"
                    }
                }
            ]
        },
        {
            "chapter": "表设计",
            "cards": [
                {
                    "title": "范式化",
                    "concept": "数据库范式化是减少数据冗余的设计原则",
                    "detail": "第一范式（1NF）要求每列不可再分；第二范式（2NF）要求非主键列完全依赖于主键；第三范式（3NF）要求非主键列不依赖于其他非主键列。实际开发中通常满足3NF即可。",
                    "analogy": "范式化就像整理你的衣柜——1NF是把所有衣服分开挂，不能把裤子和袜子塞在一件外套里（列不可再分）；2NF是每件衣服都有明确的位置（完全依赖主键）；3NF是袜子和手套分开收纳（消除传递依赖）。",
                    "tags": '["范式", "表设计", "数据库"]',
                    "difficulty": "advanced",
                    "question": {
                        "text": "第三范式（3NF）主要解决了什么问题？",
                        "options": '{"A":"数据重复","B":"数据传递依赖","C":"查询速度","D":"并发问题"}',
                        "answer": "B",
                        "explanation": "3NF 要求消除非主键列之间的传递依赖，即非主键列不能依赖于其他非主键列。"
                    }
                },
                {
                    "title": "索引",
                    "concept": "索引是加速数据库查询的数据结构",
                    "detail": "索引类似于书籍的目录，可以大幅提升查询速度。常见类型：B+树索引（适合范围查询）、哈希索引（适合等值查询）、联合索引（多列组合）。但索引也会降低写入速度并占用存储空间。",
                    "analogy": "索引就像书的目录页——如果你想找「数据库」相关的内容，直接翻目录比从第一页翻到最后一页快得多。但目录本身也占了几页纸（存储空间），每次添加新内容也要更新目录（写入开销）。",
                    "tags": '["索引", "性能优化", "数据库"]',
                    "difficulty": "intermediate",
                    "question": {
                        "text": "数据库索引的主要缺点是什么？",
                        "options": '{"A":"无法排序","B":"降低写入性能","C":"占用CPU","D":"不支持查询"}',
                        "answer": "B",
                        "explanation": "索引会降低 INSERT/UPDATE/DELETE 的写入性能，因为每次数据变更都需要同步更新索引结构。"
                    }
                }
            ]
        }
    ]
}

# K05 操作系统基础
K05 = {
    "操作系统基础": [
        {
            "chapter": "进程与线程",
            "cards": [
                {
                    "title": "进程 vs 线程",
                    "concept": "进程是资源分配的最小单位，线程是CPU调度的最小单位",
                    "detail": "进程拥有独立的地址空间和资源，线程共享所属进程的资源。创建进程的开销大但隔离性好，线程创建快但共享内存需要注意同步问题。一个进程可以包含多个线程。",
                    "analogy": "进程就像一家独立的餐厅（有自己的厨房、员工、资金），线程就像餐厅里的多个厨师（共享同一个厨房和食材）。如果一家餐厅关门（进程结束），不影响旁边的餐厅；但如果一个厨师出错（线程崩溃），可能整家餐厅都受影响。",
                    "tags": '["进程", "线程", "操作系统"]',
                    "difficulty": "intermediate",
                    "question": {
                        "text": "线程相比于进程最大的优势是什么？",
                        "options": '{"A":"更安全","B":"共享内存更方便","C":"创建和切换开销小","D":"占用更多资源"}',
                        "answer": "C",
                        "explanation": "线程共享进程的资源，创建和上下文切换的开销远小于进程，因此适合需要大量并发执行的场景。"
                    }
                },
                {
                    "title": "调度算法",
                    "concept": "调度算法决定CPU如何在多个进程/线程间分配执行时间",
                    "detail": "常见调度算法：先来先服务（FCFS）、短作业优先（SJF）、时间片轮转（Round Robin）、优先级调度、多级反馈队列。现代操作系统通常使用多级反馈队列。",
                    "analogy": "调度算法就像咖啡店里的咖啡机调度：FCFS是排队的顾客按顺序做咖啡；SJF是先做快的一杯再接力；Round Robin是每杯做几秒钟就换下一杯，轮流做。",
                    "tags": '["调度", "CPU", "操作系统"]',
                    "difficulty": "advanced",
                    "question": {
                        "text": "时间片轮转调度（Round Robin）的核心机制是什么？",
                        "options": '{"A":"优先级高的先执行","B":"每个进程分配固定时间片轮流执行","C":"最短的进程先执行","D":"先到达的先执行"}',
                        "answer": "B",
                        "explanation": "RR调度为每个进程分配一个固定时间片，按顺序轮流执行。时间片用完后切换到下一个进程，保证公平性。"
                    }
                }
            ]
        },
        {
            "chapter": "内存管理",
            "cards": [
                {
                    "title": "虚拟内存",
                    "concept": "虚拟内存让每个进程拥有独立的虚拟地址空间",
                    "detail": "虚拟内存将进程的逻辑地址映射到物理内存，通过MMU（内存管理单元）进行地址转换。优点是隔离性（进程间互不干扰）、安全性（无法访问其他进程内存）、以及可以运行比物理内存大的程序。",
                    "analogy": "虚拟内存就像电影院里的座位号——你拿到的票上写的是「3排5座」（虚拟地址），但你需要根据大厅的指示（MMU）找到对应的实际位置（物理地址）。每个观众都有自己的票，不会坐到别人腿上。",
                    "tags": '["虚拟内存", "内存管理", "操作系统"]',
                    "difficulty": "advanced",
                    "question": {
                        "text": "虚拟内存最主要的优点是什么？",
                        "options": '{"A":"让内存更大","B":"进程间内存隔离","C":"提高CPU速度","D":"减少硬盘使用"}',
                        "answer": "B",
                        "explanation": "虚拟内存为每个进程提供独立的地址空间，使进程间内存隔离，一个进程的崩溃不会影响其他进程。"
                    }
                },
                {
                    "title": "分页机制",
                    "concept": "分页将虚拟内存和物理内存划分为固定大小的页",
                    "detail": "分页将虚拟地址空间划分为固定大小的页（通常4KB），物理内存也划分为同样大小的页框。通过页表实现虚拟页到物理页框的映射。缺页时触发页面置换（如LRU淘汰算法）。",
                    "analogy": "分页机制就像一本大书被拆分成独立的小册子（页），你不需要一次把整本书搬回家，只需要带上当前阅读的几页（需要的页加载到内存）。当你想看新内容时，把最不常看的旧页放回书架（换出）。",
                    "tags": '["分页", "内存", "操作系统"]',
                    "difficulty": "advanced",
                    "question": {
                        "text": "缺页异常（Page Fault）发生时操作系统会做什么？",
                        "options": '{"A":"终止程序","B":"从硬盘加载缺失的页到内存","C":"清空所有内存","D":"重新启动系统"}',
                        "answer": "B",
                        "explanation": "当程序访问的页不在内存中时触发缺页异常，操作系统从磁盘交换区将缺失的页加载到物理内存中。"
                    }
                }
            ]
        }
    ]
}

# K06 AI编程实践技巧
K06 = {
    "AI编程实践技巧": [
        {
            "chapter": "Prompt工程",
            "cards": [
                {
                    "title": "提示词设计",
                    "concept": "好的提示词能显著提升AI输出的质量和准确性",
                    "detail": "提示词设计的核心原则：明确角色（你是...）、指定任务（请帮我...）、提供上下文和约束、给出示例（Few-shot）。好的提示词应具体、结构化、包含必要的限制条件。",
                    "analogy": "提示词设计就像给助理布置任务——「帮我处理一些事」远不如「请整理这份Excel表格，把B列按日期排序，删除重复行，保存为CSV格式」清晰有效。给AI越具体的指示，得到的结果越好。",
                    "tags": '["Prompt", "AI", "提示词"]',
                    "difficulty": "beginner",
                    "question": {
                        "text": "Few-shot prompting 是什么意思？",
                        "options": '{"A":"只用一个提示词","B":"在提示中提供几个示例","C":"用少量数据训练模型","D":"快速生成结果"}',
                        "answer": "B",
                        "explanation": "Few-shot 指在提示词中提供几个输入输出示例，让AI学习模式后按相同方式处理新的输入。"
                    }
                },
                {
                    "title": "上下文管理",
                    "concept": "有效管理上下文窗口能保持对话的连贯性和准确性",
                    "detail": "AI模型有固定的上下文窗口限制（如8K、32K、128K tokens）。管理上下文的技巧包括：优先放置关键信息、定期总结历史、使用外部记忆存储、丢弃无关的历史对话。",
                    "analogy": "上下文管理就像你做笔记的草稿纸——纸只有A4大小（上下文窗口有限）。重要的内容要写在中间（优先放置关键信息），写满时需要把不重要的擦掉（丢弃无关内容），或者做个小结贴在纸上（总结）。",
                    "tags": '["上下文", "AI", "对话"]',
                    "difficulty": "intermediate",
                    "question": {
                        "text": "当AI对话接近上下文窗口限制时，最好的处理方式是什么？",
                        "options": '{"A":"重新开始新对话","B":"总结关键信息后继续","C":"删除所有历史","D":"增加窗口大小"}',
                        "answer": "B",
                        "explanation": "当上下文接近上限时，让AI总结之前的对话内容，将总结作为新的上下文起点继续对话，是最高效的方式。"
                    }
                }
            ]
        },
        {
            "chapter": "AI辅助开发",
            "cards": [
                {
                    "title": "代码生成",
                    "concept": "AI可以根据自然语言描述生成高质量的代码",
                    "detail": "AI代码生成已经可以编写函数、类、测试、配置等。关键技巧：明确描述函数签名和输入输出、指定语言和框架、要求添加注释、通过迭代优化生成的代码。",
                    "analogy": "AI代码生成就像有一个非常熟练的程序员坐在你旁边——你告诉他「写一个Python函数，输入一个日期字符串，返回当月天数」，他立刻就能写出来。但你需要告诉他用什么格式、怎么处理边界情况。",
                    "tags": '["代码生成", "AI", "效率"]',
                    "difficulty": "intermediate",
                    "question": {
                        "text": "AI生成代码时，最重要的输入信息是什么？",
                        "options": '{"A":"代码行数","B":"函数的功能描述和输入输出","C":"程序员的名字","D":"代码的颜色主题"}',
                        "answer": "B",
                        "explanation": "明确的功能描述、输入输出规范是最重要的，这决定了AI是否能准确理解需求并生成正确的代码。"
                    }
                },
                {
                    "title": "调试辅助",
                    "concept": "AI可以帮助分析和修复代码中的错误",
                    "detail": "将错误信息、代码上下文和期望行为告诉AI，它可以快速定位问题原因并提供修复方案。适合处理：语法错误、逻辑错误、性能瓶颈、兼容性问题等。记住验证AI给出的修复方案。",
                    "analogy": "AI调试辅助就像请一位经验丰富的导师一起看代码——你把报错信息和相关代码给他看，他通常几秒钟就能指出问题所在。但最终合不采纳他的建议，决定权在你手上。",
                    "tags": '["调试", "AI", "Bug修复"]',
                    "difficulty": "beginner",
                    "question": {
                        "text": "用AI辅助调试时，最不应该做的是什么？",
                        "options": '{"A":"提供完整错误信息","B":"不加验证直接运行AI的修复建议","C":"描述期望行为","D":"提供相关代码片段"}',
                        "answer": "B",
                        "explanation": "AI的建议再好，也必须在实际环境中验证。AI可能产生幻觉或给出不完全正确的修复方案，手动验证始终是必要的。"
                    }
                }
            ]
        }
    ]
}

# K07 AI编程与传统编程
K07 = {
    "AI编程与传统编程": [
        {
            "chapter": "编程范式对比",
            "cards": [
                {
                    "title": "命令式 vs 声明式编程",
                    "concept": "命令式关注「怎么做」，声明式关注「做什么」",
                    "detail": "命令式编程（如C、Java）明确描述每一步操作，控制流程由开发者决定。声明式编程（如SQL、HTML）只描述期望结果，执行过程由系统决定。AI编程更像是声明式的——你说需求，AI完成实现。",
                    "analogy": "命令式编程就像给司机指路——「前面路口右转，直走200米，看到红绿灯左转…」。声明式编程就像告诉司机目的地——「去北京站」。AI编程就是后者，你说出要什么，AI帮你规划路线。",
                    "tags": '["编程范式", "命令式", "声明式"]',
                    "difficulty": "intermediate",
                    "question": {
                        "text": "以下哪个是声明式编程的例子？",
                        "options": '{"A":"for循环遍历数组","B":"SQL查询 SELECT * FROM users","C":"if-else 条件判断","D":"变量赋值"}',
                        "answer": "B",
                        "explanation": "SQL 是声明式编程的典型代表，你只需声明想要什么数据（SELECT），不需要指定如何获取数据。"
                    }
                },
                {
                    "title": "适用场景",
                    "concept": "传统编程和AI编程各有不同的最佳适用场景",
                    "detail": "传统编程适合：精度要求高、逻辑明确、安全性关键的系统（如银行、航空）。AI编程适合：自然语言处理、图像识别、创意生成、数据分析等模式识别任务。二者互补而非替代。",
                    "analogy": "传统编程和AI编程就像计算器和画家——计算器（传统编程）算得又快又准，但画不出一幅画；画家（AI编程）能创作艺术品，但你不会让他算工资。各自做擅长的事。",
                    "tags": '["场景", "对比", "选择"]',
                    "difficulty": "intermediate",
                    "question": {
                        "text": "以下哪个场景最适合传统编程而非AI编程？",
                        "options": '{"A":"写一首诗","B":"银行交易系统","C":"图像识别","D":"语音转文字"}',
                        "answer": "B",
                        "explanation": "银行交易系统对精度和确定性要求极高，需要精确的计算和严格的逻辑控制，传统编程更适合。"
                    }
                }
            ]
        },
        {
            "chapter": "效率对比",
            "cards": [
                {
                    "title": "开发速度",
                    "concept": "AI编程在原型开发和简单功能实现上速度显著更快",
                    "detail": "对于常见的CRUD操作、UI组件、工具函数等，AI可以在几秒内生成代码，节省大量时间。但复杂系统架构设计、性能优化、安全审计等方面，人类的经验和判断仍然不可替代。",
                    "analogy": "AI编程的快速开发就像外卖和做饭的区别——点外卖（用AI）几分钟就能吃到饭，适合日常简单需求；自己做饭（手写代码）虽然慢，但可以精确控制食材、口味和营养，适合做复杂的大餐。",
                    "tags": '["效率", "开发速度", "AI"]',
                    "difficulty": "beginner",
                    "question": {
                        "text": "AI编程在什么场景下效率提升最明显？",
                        "options": '{"A":"设计系统架构","B":"编写常见模板代码","C":"性能优化","D":"安全审计"}',
                        "answer": "B",
                        "explanation": "对于常见的模板代码、CRUD操作、工具函数等有明确模式的任务，AI生成速度最快，效率提升最明显。"
                    }
                },
                {
                    "title": "质量对比",
                    "concept": "AI生成代码的质量取决于输入的明确程度和领域复杂度",
                    "detail": "对于明确定义的小型任务，AI生成代码的质量可达到甚至超过初级开发者水平。但在大型系统、安全性要求高的场景，AI代码需要人工审查。最佳实践是让AI生成初稿，人类优化和验证。",
                    "analogy": "AI写代码的质量就像请不同水平的助手——对于「帮我整理这份文件」这种简单任务，任何人做都差不多；但对于「设计这个复杂系统的架构」，需要资深专家来把控方向。AI是强大的初级助手，专家是最后的把关人。",
                    "tags": '["质量", "对比", "最佳实践"]',
                    "difficulty": "intermediate",
                    "question": {
                        "text": "使用AI生成代码时的最佳实践是什么？",
                        "options": '{"A":"直接信任所有AI代码","B":"AI生成初稿+人工审查优化","C":"完全不用AI","D":"只用AI调试不用AI写代码"}',
                        "answer": "B",
                        "explanation": "最有效的实践是让AI生成代码初稿，然后由开发者进行审查、优化和测试，结合AI的速度和人类的判断力。"
                    }
                }
            ]
        }
    ]
}

ALL_DOMAINS = [K01, K02, K03, K04, K05, K06, K07]


def upgrade():
    # Phase 1: Insert all chapters
    for domain_dict in ALL_DOMAINS:
        for domain_name, chapters in domain_dict.items():
            for ch_idx, chapter in enumerate(chapters):
                ch_sort = (ch_idx + 1) * 10
                op.execute(
                    f"INSERT INTO knowledge.chapter (domain_id, name, sort_order, status) "
                    f"SELECT id, {escape(chapter['chapter'])}, {ch_sort}, 'published' "
                    f"FROM knowledge.domain WHERE name = {escape(domain_name)}"
                )

    # Phase 2: Insert all cards
    for domain_dict in ALL_DOMAINS:
        for domain_name, chapters in domain_dict.items():
            for ch_idx, chapter in enumerate(chapters):
                ch_sort = (ch_idx + 1) * 10
                for card_idx, card in enumerate(chapter["cards"]):
                    card_sort = (card_idx + 1) * 10
                    op.execute(f"""
                        INSERT INTO knowledge.card (
                            chapter_id, title, core_concept, detail, life_analogy, tags,
                            difficulty, status
                        )
                        SELECT ch.id,
                               {escape(card['title'])},
                               {escape(card['concept'])},
                               {escape(card['detail'])},
                               {escape(card['analogy'])},
                               {escape(card['tags'])}::jsonb,
                               {escape(card['difficulty'])},
                               'published'
                        FROM knowledge.chapter ch
                        JOIN knowledge.domain d ON d.id = ch.domain_id
                        WHERE d.name = {escape(domain_name)}
                          AND ch.name = {escape(chapter['chapter'])}
                    """)

    # Phase 3: Insert all questions
    for domain_dict in ALL_DOMAINS:
        for domain_name, chapters in domain_dict.items():
            for chapter in chapters:
                for card in chapter["cards"]:
                    q = card["question"]
                    op.execute(f"""
                        INSERT INTO knowledge.question (card_id, question_text, options, correct_option, explanation)
                        SELECT cd.id,
                               {escape(q['text'])},
                               {escape(q['options'])}::jsonb,
                               {escape(q['answer'])},
                               {escape(q['explanation'])}
                        FROM knowledge.card cd
                        JOIN knowledge.chapter ch ON ch.id = cd.chapter_id
                        JOIN knowledge.domain d ON d.id = ch.domain_id
                        WHERE d.name = {escape(domain_name)}
                          AND ch.name = {escape(chapter['chapter'])}
                          AND cd.title = {escape(card['title'])}
                    """)


def downgrade():
    for domain_dict in ALL_DOMAINS:
        for domain_name in domain_dict:
            op.execute(f"""
                DELETE FROM knowledge.question
                WHERE card_id IN (
                    SELECT cd.id FROM knowledge.card cd
                    JOIN knowledge.chapter ch ON ch.id = cd.chapter_id
                    JOIN knowledge.domain d ON d.id = ch.domain_id
                    WHERE d.name = {escape(domain_name)}
                )
            """)
            op.execute(f"""
                DELETE FROM knowledge.card
                WHERE chapter_id IN (
                    SELECT ch.id FROM knowledge.chapter ch
                    JOIN knowledge.domain d ON d.id = ch.domain_id
                    WHERE d.name = {escape(domain_name)}
                )
            """)
            op.execute(f"""
                DELETE FROM knowledge.chapter
                WHERE domain_id = (SELECT id FROM knowledge.domain WHERE name = {escape(domain_name)})
            """)
