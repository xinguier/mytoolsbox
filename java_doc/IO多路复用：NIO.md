结构化面试
1、代码：代码风格、严谨性； 15分钟以内 （一票否决）
2、系统开发知识：精通系统服务在实际运行过程中所经过各环节的相关知识、原理和影响；  20分钟
网络：（可选项）

 ###  IO多路复用：NIO
​	BIO （Blocking I/O）：**同步阻塞I/O**，是JDK1.4之前的传统IO模型。 线程发起IO请求后，一直阻塞，直到缓冲区数据就绪后，再进入下一步操作。
​	NIO （<font style="color:rgb(37, 41, 51);">Non-Blocking</font> I/O）：**同步非阻塞IO**，线程发起IO请求后，不需要阻塞，立即返回。用户线程不原地等待IO缓冲区，可以先做一些其他操作，只需要定时轮询检查IO缓冲区数据是否就绪即可。
​	AIO （ Asynchronous I/O）：**异步非阻塞I/O模型**。线程发起IO请求后，不需要阻塞，立即返回，也不需要定时轮询检查结果，异步IO操作之后会回调通知调用方。

 ###  netty 粘包处理
​	在 Netty 中，粘包（Sticky Packets）是 TCP 通信中常见的问题，指的是多个发送方的数据包在接收端被合并成一个大的数据包，或者一个完整的数据包被拆分成多个小数据包（拆包）的现象。这是由于 TCP 是流式协议，数据在传输过程中没有明确的边界划分，会根据网络情况进行分组优化。

粘包 / 拆包处理就是通过特定机制，在接收端正确识别出完整的数据包边界，确保应用程序能获取到完整、正确的数据单元。

### Netty 中常见的粘包处理方案

Netty 提供了多种编码器（Encoder）和解码器（Decoder）来解决粘包问题，核心思想是**定义清晰的数据包格式**，让接收端能够正确拆分数据：

1. **固定长度协议（FixedLengthFrameDecoder）**

   - 规定每个数据包的固定长度
   - 接收端按固定长度拆分数据

   ```java
   // 每个数据包固定100字节
   pipeline.addLast(new FixedLengthFrameDecoder(100));
   ```
   
2. **分隔符协议（DelimiterBasedFrameDecoder）**

   - 用特殊分隔符（如`\n`、`\r\n`）标识数据包结束

   ```java
   // 以"$"作为分隔符，最大长度1024字节
   ByteBuf delimiter = Unpooled.copiedBuffer("$".getBytes());
   pipeline.addLast(new DelimiterBasedFrameDecoder(1024, delimiter));
   ```
   
3. **长度字段协议（LengthFieldBasedFrameDecoder）**

   - 在数据包头部添加一个表示数据长度的字段
   - 最灵活通用的方案，适用于大多数场景

   ```java
   // 前4字节表示数据长度，总长度=长度字段值+4
   pipeline.addLast(new LengthFieldBasedFrameDecoder(
       1024,    // 最大帧长度
       0,       // 长度字段偏移量
       4,       // 长度字段占4字节
       0,       // 长度字段调整值
       4        // 跳过长度字段字节数
   ));
   ```
   
4. **自定义协议**

   - 根据业务需求设计协议格式（如头部 + 数据体）
   - 自定义编码器和解码器处理

### 处理流程

1. 发送端：通过编码器按协议格式封装数据（如添加长度字段、分隔符）
2. 接收端：通过解码器按协议格式拆分数据，得到完整数据包
3. 应用程序：从解码器获取拆分后的完整数据进行处理

合理选择粘包处理方案能确保 Netty 通信中数据的完整性和正确性，是构建可靠网络应用的基础。实际开发中，长度字段协议因灵活性强而被广泛使用。

### 中间件：（4选2）
   MQ  组成原理（2-3）、重复消费（2-3）、高可用（2-3 基本了解）、性能（3-1）

​	MQ（Message Queue，消息队列）是一种基于异步通信模式的中间件，用于在分布式系统中实现组件间的解耦、削峰填谷和异步通信。其核心是通过**存储转发**机制，让消息发送方和接收方无需实时交互。

### MQ 的核心组成部分

1. **生产者（Producer）**
   - 消息的发送方，负责创建和发送消息到队列
   - 支持同步 / 异步发送、事务消息等模式
2. **消费者（Consumer）**
   - 消息的接收方，从队列中获取并处理消息
   - 消费模式：推模式（Push）、拉模式（Pull）
3. **消息（Message）**
   - 核心数据单元，包含：
     - 消息体（Payload）：实际业务数据
     - 元数据：消息 ID、时间戳、主题、标签等
     - 属性：自定义键值对，用于过滤或路由
4. **队列（Queue）**
   - 消息的存储容器，通常是 FIFO（先进先出）结构
   - 不同 MQ 对队列的实现不同：
     - 如 RabbitMQ 的队列是持久化存储
     - Kafka 的队列是分区日志文件
5. **交换机 / 主题（Exchange/Topic）**
   - 消息路由中间件（如 RabbitMQ 的 Exchange、Kafka 的 Topic）
   - 负责将消息从生产者路由到对应的队列
   - 支持多种路由策略：Direct、Fanout、Topic、Headers 等
6. ** Broker **- MQ 服务的核心节点，负责消息的存储、转发和管理
   - 可集群部署，提供高可用和扩展性

### MQ 工作原理（核心流程）

1.** 消息发送 **- 生产者创建消息，指定目标主题 / 队列

- 消息经过序列化后发送到 Broker
- Broker 根据路由规则将消息存储到对应的队列

2.** 消息存储 **- Broker 将消息持久化到磁盘（可选），防止数据丢失

- 维护消息的状态（待消费、已消费、死信等）

3.** 消息投递 **- 消费者通过订阅关系获取消息

- Broker 将消息推送给消费者，或消费者主动拉取
- 支持消息确认机制（Ack），确保消息被正确处理

4.** 消息确认 **- 消费者处理完成后发送确认信号

- Broker 收到确认后标记消息为已消费，或根据策略重新投递

### 典型消息确认机制

1.** 自动确认 **- 消息发送到消费者后立即标记为已消费

- 优点：效率高；缺点：可能丢失消息

2.** 手动确认 **- 消费者处理完成后显式发送确认

java

```java
// RabbitMQ 手动确认示例
channel.basicAck(deliveryTag, false); // 确认消息
channel.basicNack(deliveryTag, false, true); // 拒绝并重新入队
```

3. ** 事务消息 ** 确保消息发送和本地事务的原子性

- 如 RocketMQ 的事务消息机制

### 核心特性实现原理

1.** 持久化 **- 机制：将消息写入磁盘文件或数据库

- 如 Kafka 的分区日志、RabbitMQ 的持久化队列

2.** 高可用 **- 集群部署：主从复制、多副本机制

- 故障转移：自动选举新主节点（如 Kafka 的 ISR 机制）

3.** 消息顺序性 **- 单分区内消息 FIFO，多分区需额外控制

- 如 Kafka 通过分区键保证同一键的消息顺序

4.** 死信队列 **- 处理无法正常消费的消息（过期、多次消费失败）

- 用于问题排查和消息重试

### 常见 MQ 产品对比

| 特性       | RabbitMQ         | Kafka              | RocketMQ  aliyun   |
| ---------- | ---------------- | ------------------ | ------------------ |
| 吞吐量     | 中               | 高（百万级 / 秒）  | 高（十万级 / 秒）  |
| 延迟消息   | 支持             | 不直接支持         | 原生支持           |
| 事务消息   | 支持             | 不直接支持         | 原生支持           |
| 路由灵活性 | 高（多种交换机） | 中（Topic + 分区） | 中（Topic+Tag）    |
| 适用场景   | 复杂路由、低延迟 | 大数据流、日志收集 | 分布式事务、高可用 |

MQ 的核心价值在于**解耦系统组件**、**削峰填谷**和**异步通信**，选择时需结合业务场景（如吞吐量、延迟要求、功能需求）和运维成本综合考量。	

   RPC 原理 框架 最佳实践	

​	RPC（Remote Procedure Call，远程过程调用）原理

RPC 是一种通信协议，允许一台计算机（客户端）调用另一台计算机（服务器）上的函数或方法，而无需了解底层网络细节。其核心目标是**让远程调用像本地调用一样简单**。

#### 基本原理

1. **客户端调用**：客户端通过本地接口发起调用，传入参数
2. **序列化**：将调用信息（类名、方法名、参数等）序列化为字节流
3. **网络传输**：通过网络协议（TCP/UDP/HTTP 等）将数据发送到服务器
4. **服务端接收**：服务器监听端口，接收请求数据
5. **反序列化**：将字节流还原为调用信息
6. **执行方法**：找到对应的服务实现，执行方法并获取返回值
7. **结果返回**：将返回值序列化后通过网络传回客户端
8. **客户端处理**：反序列化结果，返回给调用者

### 主流 RPC 框架

#### 1. **Java 生态**

- **Dubbo**：阿里巴巴开源，高性能、轻量级，支持服务治理、负载均衡、容错等
- **Spring Cloud**：基于 Spring 生态，整合了多种组件（Feign、Eureka 等），侧重微服务架构
- **gRPC**：Google 开源，基于 HTTP/2 和 Protocol Buffers，跨语言支持好
- **Thrift**：Apache 开源，跨语言 RPC 框架，支持多种传输协议和数据格式

#### 2. **其他语言**

- **Go**：gRPC、Go-Micro
- **Python**：gRPC、Pyro4
- **Node.js**：gRPC、dnode

### RPC 最佳实践

#### 1. **协议设计**

- 选择合适的序列化方式
  - 追求性能：Protocol Buffers、Thrift
  - 追求可读性：JSON、XML（适合调试，性能较差）
- **明确服务接口定义**：使用 IDL（接口定义语言）规范接口，如 Protobuf、Thrift IDL

#### 2. **可靠性保障**

- 超时控制

  ：设置合理的超时时间，避免客户端无限等待

  java

  ```java
  // Dubbo 超时配置示例
  <dubbo:reference interface="com.example.Service" timeout="3000"/>
  ```

- **重试机制**：对幂等操作可配置重试，非幂等操作慎用

- **熔断降级**：使用 Hystrix、Sentinel 等组件，防止服务雪崩

- **负载均衡**：选择合适策略（轮询、随机、权重等）

#### 3. **性能优化**

- **连接复用**：使用长连接减少握手开销
- **异步调用**：非关键路径使用异步，提高吞吐量
- **压缩传输**：对大数据进行压缩（gzip、snappy）
- **批量处理**：合并多个小请求，减少网络往返

#### 4. **服务治理**

- **服务注册与发现**：使用 ZooKeeper、Nacos、Eureka 等

- **监控与追踪**：集成 Prometheus、Grafana 监控指标，使用 Zipkin、Jaeger 追踪调用链

- 版本控制

  ：支持接口多版本，实现平滑升级

  protobuf

  ```protobuf
  // gRPC 版本控制示例
  service UserServiceV1 { ... }
  service UserServiceV2 { ... }
  ```

#### 5. **安全性**

- **传输加密**：使用 TLS/SSL 加密网络传输
- **身份认证**：添加令牌（Token）或签名验证
- **权限控制**：基于角色的访问控制（RBAC）

### 典型代码示例（gRPC）

定义服务接口（.proto 文件）：

protobuf

```protobuf
syntax = "proto3";

service Greeter {
  rpc SayHello (HelloRequest) returns (HelloReply);
}

message HelloRequest {
  string name = 1;
}

message HelloReply {
  string message = 1;
}
```

服务端实现：

java

```java
public class GreeterImpl extends GreeterGrpc.GreeterImplBase {
  @Override
  public void sayHello(HelloRequest req,
                       StreamObserver<HelloReply> responseObserver) {
    HelloReply reply = HelloReply.newBuilder()
        .setMessage("Hello " + req.getName())
        .build();
    responseObserver.onNext(reply);
    responseObserver.onCompleted();
  }
}
```

客户端调用：

java

```java
ManagedChannel channel = ManagedChannelBuilder
    .forAddress("localhost", 50051)
    .usePlaintext()
    .build();

GreeterGrpc.GreeterBlockingStub stub = GreeterGrpc.newBlockingStub(channel);
HelloReply response = stub.sayHello(HelloRequest.newBuilder()
    .setName("World")
    .build());

System.out.println(response.getMessage()); // 输出 "Hello World"
channel.shutdown();
```

### 总结

RPC 框架极大简化了分布式系统的开发，但需根据业务场景选择合适的框架，并关注**可靠性、性能、可扩展性**三大核心要素。在微服务架构中，RPC 通常与服务注册发现、配置中心、熔断降级等组件配合使用，构建完整的服务生态。	

##  Redis 数据结构（必会），高可用、分槽、热点数据、击穿、分布式锁（redis、 Zookper）

​	Redis 核心知识点总结

#### 一、Redis 核心数据结构（必会）

Redis 提供了丰富的数据结构，每种结构都有特定的应用场景：

1. **String（字符串）**
   - 最基础的键值对，value 可以是字符串、数字或二进制
   - 常用命令：`set`, `get`, `incr`, `decr`, `append`
   - 应用：缓存、计数器、分布式 ID
2. **Hash（哈希）**
   - 键值对集合，适合存储对象（如用户信息）
   - 常用命令：`hset`, `hget`, `hgetall`, `hdel`
   - 优势：节省内存，可单独操作字段
3. **List（列表）**
   - 有序字符串集合，支持两端操作
   - 常用命令：`lpush`, `rpop`, `lrange`, `llen`
   - 应用：消息队列、最新列表、排行榜
4. **Set（集合）**
   - 无序唯一元素集合，支持交集、并集、差集
   - 常用命令：`sadd`, `smembers`, `sinter`, `sunion`
   - 应用：标签、好友关系、去重
5. **Sorted Set（有序集合）**
   - 带分数的有序集合，分数可排序
   - 常用命令：`zadd`, `zrange`, `zrank`, `zincrby`
   - 应用：排行榜、延迟队列、范围查询
6. **高级结构**
   - **Bitmap**：位操作，适合统计（如用户签到）
   - **HyperLogLog**：基数统计，占用空间极小
   - **Geo**：地理位置信息，支持距离计算

#### 二、Redis 高可用方案

1. **主从复制（Master-Slave）**
   - 主节点写入，从节点同步并提供读服务
   - 实现：`replicaof masterip masterport`
   - 作用：读写分离，数据备份
2. **哨兵（Sentinel）**
   - 监控主从节点，自动故障转移
   - 当主节点故障，自动从从节点中选举新主
   - 配置：至少 3 个哨兵节点保证高可用
3. **Redis Cluster（集群）**
   - 分片存储数据，默认 16384 个哈希槽
   - 每个节点负责部分槽，自动迁移槽位
   - 多主多从，支持高可用和水平扩展

#### 三、Redis 分槽（Hash Slot）

Redis Cluster 采用哈希槽实现数据分片：

- 共 16384 个槽位，每个 key 通过`CRC16(key) % 16384`计算槽位
- 每个节点负责一定范围的槽位（如节点 A 负责 0-5000 槽）
- 优势：
  - 数据均匀分布，避免单节点压力过大
  - 支持动态扩缩容，槽位可迁移
- 客户端路由：
  - 重定向模式：收到`MOVED`指令后重新请求正确节点
  - 智能客户端：本地缓存槽位信息，直接路由

#### 四、热点数据问题及解决

热点数据指访问频率极高的 key（如秒杀商品），可能导致单节点压力过大：

1. **问题表现**
   - 节点 CPU / 内存使用率飙升
   - 网络带宽耗尽
   - 响应延迟增加
2. **解决方案**
   - **本地缓存**：将热点数据缓存到应用本地（Caffeine、Guava）
   - **数据分片**：将大 key 拆分为多个小 key（如`user:1000`拆分为`user:1000:1`、`user:1000:2`）
   - **读写分离**：通过主从架构分散读压力
   - **热点参数过滤**：对高频访问的参数做特殊处理
   - **Redis Cluster 预分片**：提前规划槽位分布，避免热点集中

#### 五、缓存击穿与防护

缓存击穿指一个热点 key 过期瞬间，大量请求穿透到数据库：

1. 解决方案

   - 互斥锁

     ：第一个请求获取锁后查询 DB 并更新缓存，其他请求等待

     java

     ```java
     // 伪代码
     String lockKey = "lock:product:" + id;
     if (redis.set(lockKey, "1", "PX", 1000, "NX")) {
         try {
             // 查询DB并更新缓存
             Product product = db.query(id);
             redis.set(key, product, 3600);
             return product;
         } finally {
             redis.del(lockKey);
         }
     } else {
         // 重试或返回默认值
         Thread.sleep(50);
         return getProduct(id);
     }
     ```

   - **热点 key 永不过期**：业务层面控制过期时间，不设置 Redis 过期

   - **布隆过滤器**：提前过滤不存在的 key，防止恶意攻击

#### 六、分布式锁实现

##### 1. Redis 分布式锁

核心原理：利用`SET key value NX PX timeout`命令实现互斥

`SET key value NX PX timeout` 是 Redis 中一个非常重要的复合命令，主要用于**实现分布式锁**或**确保键的原子性设置**，其核心作用是 “仅在键不存在时设置键值，并同时指定的过期时间”。

### 命令解析

- **`SET key value`**：基础的设置键值对命令。
- **`NX`**：全称 `Not Exist`，是一个条件选项，表示**仅当键不存在时才执行设置操作**（如果键已存在，则命令直接返回 `nil`，不做任何操作）。
- **`PX timeout`**：`PX` 表示以**毫秒**为单位设置过期时间，`timeout` 是具体的过期时长（如 `1000` 表示 1 秒后过期）。

### 核心特性

1. **原子性**：整个命令是一个原子操作，不会被其他 Redis 命令打断。这意味着 “检查键是否存在” 和 “设置键值 + 过期时间” 是一个不可分割的步骤，避免了并发场景下的竞态条件。
2. **互斥性**：结合 `NX` 选项，同一时间只有一个客户端能成功设置键，天然适合实现分布式锁（只有拿到锁的客户端能设置成功）。
3. **自动释放**：`PX` 选项确保键会在超时后自动删除，避免因客户端崩溃等原因导致的 “锁永久持有” 问题。

### 典型应用：分布式锁

这一命令是实现分布式锁的核心：

- 客户端通过 `SET key value NX PX timeout` 尝试获取锁（`key` 为锁标识，`value` 为客户端唯一标识，如 UUID）。
- 若返回 `OK`，表示获取锁成功，执行业务逻辑。
- 业务完成后，通过 Lua 脚本删除锁（需验证 `value` 为当前客户端标识，避免误删其他客户端的锁）。
- 若获取锁失败，则等待重试或直接返回。

### 总结

`SET key value NX PX timeout` 命令通过原子性的 “检查 - 设置 - 过期” 操作，完美解决了分布式场景下的互斥问题，是实现分布式锁的标准方案，也广泛用于需要 “仅创建不存在的键并自动过期” 的场景。

```java
// 加锁
boolean tryLock(String key, String value, long timeout) {
    return redisTemplate.opsForValue().setIfAbsent(key, value, timeout, TimeUnit.MILLISECONDS);
}

// 解锁（需验证value防止误删）
boolean unlock(String key, String value) {
    String script = "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end";
    Long result = redisTemplate.execute(new DefaultRedisScript<>(script, Long.class), 
                                      Collections.singletonList(key), value);
    return result != null && result > 0;
}
```

缺陷：集群环境下可能因主从切换导致锁丢失（Redisson 可解决）

##### 2. Zookeeper 分布式锁

基于临时节点和 Watcher 机制：

```java
// 伪代码
String lockPath = "/locks/product1";
String nodePath = zkClient.createEphemeralSequential(lockPath + "/", "");
List<String> children = zkClient.getChildren(lockPath);
Collections.sort(children);

if (nodePath.equals(lockPath + "/" + children.get(0))) {
    // 获取锁成功
    return true;
} else {
    // 监听前一个节点
    String prevNode = children.get(index - 1);
    CountDownLatch latch = new CountDownLatch(1);
    zkClient.watchForData(lockPath + "/" + prevNode, (data, stat) -> latch.countDown());
    latch.await();
    return true;
}
```

优势：可靠性更高，适合数据一致性要求高的场景

##### 3. 两种方案对比

| 特性       | Redis 锁         | Zookeeper 锁   |
| ---------- | ---------------- | -------------- |
| 性能       | 高               | 中             |
| 可靠性     | 较低（可能丢失） | 高             |
| 实现复杂度 | 中（需处理超时） | 高             |
| 适用场景   | 高并发、低延迟   | 数据一致性优先 |

### 总结

Redis 是分布式系统中的核心组件，掌握其数据结构是基础，高可用方案是保障，而解决热点数据、缓存击穿和分布式锁等问题则是生产环境中的关键实践。实际应用中需根据业务场景选择合适的方案，平衡性能与可靠性。



 ###   数据库：索引、分库分表、慢查询

数据库是系统的核心存储组件，其性能直接影响整体系统的响应速度和稳定性。以下从**索引**（性能优化核心）、**分库分表**（海量数据存储方案）、**慢查询**（性能问题诊断）三个维度，详解数据库核心技术与实践。


### 一、索引：提升查询效率的核心
索引是数据库中用于加速查询的数据结构，类似书籍的目录，通过预先组织数据位置，避免全表扫描。


#### 1. 索引的核心原理
- **本质**：以空间换时间，通过维护额外的数据结构（如B+树），存储关键字与数据行地址的映射，使查询从全表扫描（O(n)）优化为索引定位（O(log n)）。
- **存储结构**：主流数据库（如MySQL InnoDB）默认使用**B+树索引**：
  - 叶子节点存储数据（聚簇索引）或指向数据的指针（非聚簇索引）。
  - 所有叶子节点通过链表连接，支持范围查询（如`between`、`order by`）。


#### 2. 常见索引类型
| 索引类型         | 特点                                                                 | 适用场景                     |
|------------------|----------------------------------------------------------------------|------------------------------|
| **主键索引**     | 自动创建，唯一且非空，InnoDB中是聚簇索引（叶子节点存储整行数据）。   | 按主键查询（如`where id=1`） |
| **二级索引**     | 基于非主键字段创建，叶子节点存储主键值（需回表查询完整数据）。       | 高频查询的非主键字段（如`where name='xxx'`） |
| **联合索引**     | 多个字段组合的索引，遵循“最左前缀匹配原则”。                         | 多条件查询（如`where a=1 and b=2`） |
| **唯一索引**     | 确保字段值唯一（允许null），查询性能略高于普通索引。                 | 需唯一性约束的字段（如`user_name`） |
| **哈希索引**     | 基于哈希表，查询单值极快，但不支持范围查询。                         | 高频等值查询（如`where phone=138xxxx`），MySQL Memory引擎支持。 |


#### 3. 索引使用原则与误区
- **建索引的场景**：
  - 高频查询字段（如`where`、`join`、`order by`后的字段）。
  - 区分度高的字段（如`id`、`phone`，区分度低的字段如`gender`建索引收益低）。
  
- **不建议建索引的场景**：
  - 低频查询字段（索引维护成本高于查询收益）。
  - 表数据量极小（全表扫描比索引查询更快）。
  - 频繁更新的字段（索引会随数据更新而重建，影响写入性能）。

- **索引失效的常见情况**：
  - 索引字段使用函数（如`where SUBSTR(name,1,3)='abc'`）。
  - 隐式类型转换（如`where phone='138'`，`phone`为int类型时）。
  - 模糊查询以`%`开头（如`where name like '%abc'`）。
  - 联合索引不满足最左前缀（如联合索引`(a,b)`，查询`where b=2`）。


### 二、分库分表：解决海量数据存储瓶颈
当单表数据量达到千万级（MySQL）或亿级时，查询性能会急剧下降（索引体积过大、IO效率低），分库分表是解决这一问题的核心方案。


#### 1. 为什么需要分库分表？
单库单表的瓶颈：
- 存储瓶颈：单表数据量过大，磁盘IO压力剧增（如1亿行数据的表，全表扫描耗时分钟级）。
- 并发瓶颈：单库连接数有限（MySQL默认最大连接数151），高并发下连接阻塞。


#### 2. 分库分表的两种方式
##### （1）垂直拆分（按“列”拆分）
- **原理**：将一个字段多、数据量大的表，按业务关联性拆分为多个小表（分表）；或按业务模块将数据库拆分为多个库（分库）。
- **示例**：
  - 垂直分表：将`user`表拆分为`user_base`（基本信息：id、name）和`user_ext`（扩展信息：address、avatar）。
  - 垂直分库：将电商数据库拆分为`user_db`（用户）、`order_db`（订单）、`product_db`（商品）。
- **适用场景**：表字段过多（如包含大文本、Blob字段），或业务模块耦合度低。


##### （2）水平拆分（按“行”拆分）
- **原理**：将一个表的行数据，按规则（如哈希、范围）分散到多个表（分表）或多个库（分库），每个表/库结构相同，数据不同。
- **拆分规则**：
  - **范围拆分**：按时间（如`order_2023`、`order_2024`）、ID范围（如`user_1_100w`、`user_100w_200w`）。
  - **哈希拆分**：按主键哈希（如`id % 8`，分散到8个表），确保数据均匀分布。
- **示例**：将`order`表按用户ID哈希拆分为`order_0`到`order_7`共8个表，用户ID=100的订单存入`order_4`（100%8=4）。
- **适用场景**：单表数据量过大（千万级以上），且查询条件包含拆分键（如按用户ID查询订单）。


#### 3. 分库分表的实现与挑战
- **实现工具**：
  - 客户端框架：Sharding-JDBC（轻量级，嵌入应用）、MyBatis-Plus分表插件。
  - 中间件：MyCat（独立部署，支持复杂路由）。

- **核心挑战**：
  - **跨库查询**：拆分后无法直接执行`join`多表（需应用层聚合或全局表）。
  - **分布式事务**：跨库操作需保证一致性（如Seata、TCC模式）。
  - **主键生成**：避免分表后主键冲突（使用雪花算法、UUID、数据库自增步长）。


### 三、慢查询：性能问题的“报警器”
慢查询是指执行时间超过阈值的SQL语句（如MySQL默认10秒），是数据库性能问题的主要来源，需重点监控和优化。


#### 1. 慢查询的定位
- **开启慢查询日志**（MySQL为例）：
  ```sql
  -- 查看配置
  show variables like 'slow_query_log'; -- 是否开启
  show variables like 'long_query_time'; -- 慢查询阈值（默认10秒，建议设为1秒）
  
  -- 临时开启（重启失效）
  set global slow_query_log = on;
  set global slow_query_log_file = '/var/log/mysql/slow.log';
  set global long_query_time = 1; -- 阈值1秒
  ```
- **分析工具**：
  - `mysqldumpslow`：MySQL自带工具，统计慢查询TOP N（如`mysqldumpslow -s t -t 10 /var/log/mysql/slow.log`）。
  - Percona Toolkit：`pt-query-digest`，更详细的慢查询分析（包含执行计划、锁等待等）。


#### 2. 慢查询的常见原因与优化
| 原因                  | 优化方案                                                                 |
|-----------------------|--------------------------------------------------------------------------|
| 全表扫描（无索引）    | 为查询字段添加合适的索引（如`where`后的字段）。                           |
| 索引失效              | 修正SQL，避免索引失效场景（如去除函数、优化`like`查询）。                 |
| `select *` 全字段查询 | 只查询需要的字段（减少IO和内存消耗）。                                   |
| 大表分页（`limit 100000, 10`） | 基于主键分页（`where id > 100000 limit 10`），避免全表扫描。              |
| 多表JOIN过多          | 减少JOIN表数量，小表驱动大表（`left join`时小表放左），为JOIN字段建索引。 |
| 锁等待（如行锁、表锁） | 优化事务逻辑，减少锁持有时间；避免长事务。                               |


#### 3. 优化示例
慢查询：
```sql
-- 全表扫描，无索引
select * from order where create_time > '2023-01-01';
```
优化后：
```sql
-- 添加索引
create index idx_order_create_time on order(create_time);

-- 只查需要的字段
select id, order_no from order where create_time > '2023-01-01';
```


### 总结
- **索引**是提升查询效率的基础，需结合业务场景合理设计，避免过度索引或索引失效。
- **分库分表**是海量数据的存储方案，垂直拆分解耦业务，水平拆分分散数据量，需解决跨库查询和分布式事务问题。
- **慢查询**是性能优化的入口，通过日志定位问题，结合索引优化、SQL重构提升执行效率。

三者协同作用，才能构建高性能、高可用的数据库层，支撑业务的持续增长。

## JAVA基础：（基本掌握，基本线：50%）
### 多线程：线程池参数、执行逻辑、核心线程数设置，内核切换；AB线程等待，工具类，aqs原理，volatile，如何查看死锁，避免死锁，乐观锁，悲观锁，公平锁，threadlocal；

### 多线程核心知识点总结

#### 一、线程池

1. **核心参数（ThreadPoolExecutor）**

   - `corePoolSize`：核心线程数（常驻线程，即使空闲也不销毁）
   - `maximumPoolSize`：最大线程数（核心线程 + 临时线程的上限）
   - `keepAliveTime`：临时线程空闲超时时间
   - `workQueue`：任务阻塞队列（核心线程满时存放任务）
   - `threadFactory`：线程创建工厂（自定义线程名、优先级等）
   - `handler`：拒绝策略（队列满且线程达最大值时的处理方式）

2. **执行逻辑**

   ```plaintext
   提交任务 → 核心线程未满？ → 创建核心线程执行
               ↓ 否
           队列未满？ → 放入队列等待
               ↓ 否
           总线程数<最大线程数？ → 创建临时线程执行
               ↓ 否
           执行拒绝策略（抛异常/丢弃/调用者执行等）
   ```
   
3. **核心线程数设置**

   - **CPU 密集型任务**：核心线程数 = CPU 核心数 + 1（减少线程切换损耗）
   - **IO 密集型任务**：核心线程数 = CPU 核心数 × 2（利用 IO 等待时间）
   - 实际需结合压测调整，可参考公式：`N_threads = N_cpu * U_cpu * (1 + W/C)`，其中 W/C 为等待时间与计算时间比

#### 二、线程切换与内核态

- **用户态→内核态切换**：线程阻塞（IO 操作、sleep 等）时发生，由操作系统调度

- **切换成本**：保存 / 恢复线程上下文（寄存器、栈信息等），耗时约 1-10 微秒

- **优化方向**：减少不必要的线程切换（合理设置线程数、避免频繁阻塞）

  ### 一、Java 线程与操作系统线程的关系

  现代 JVM（如 HotSpot）采用**1:1 线程模型**：即一个 Java 线程直接映射到一个操作系统的内核线程（Kernel Thread）。

  - Java 代码中通过`new Thread().start()`创建的线程，最终会由 JVM 调用操作系统的 API（如 Linux 的`pthread_create`）创建一个内核线程。
  - Java 线程的调度（何时运行、何时暂停）完全由操作系统内核的调度器（Scheduler）控制，JVM 本身不直接参与调度。

  ### 二、什么是 “内核切换”（线程上下文切换）？

  当操作系统需要让不同的线程轮流使用 CPU 时，会发生**上下文切换**：

  1. **保存当前线程状态**：将正在运行的线程的 CPU 寄存器、程序计数器（下一条要执行的指令地址）、栈指针等信息保存到内存中（线程的 PCB 控制块）。
  2. **加载新线程状态**：从内存中读取待运行线程的状态，恢复到 CPU 寄存器中，让 CPU 开始执行新线程的指令。

  这个 “保存 - 加载” 的过程由操作系统内核完成，因此称为 “内核切换”。

  ### 三、为什么会发生内核切换？

  操作系统调度线程的核心目标是 “最大化 CPU 利用率”，以下场景会触发切换：

  1. **时间片用完**：操作系统给每个线程分配一个 “时间片”（如 10ms），时间片耗尽后，调度器会暂停当前线程，切换到其他就绪线程。
  2. **线程阻塞**：线程执行了阻塞操作（如`Thread.sleep()`、等待锁、IO 读写），主动放弃 CPU，调度器会切换到其他可运行线程。
  3. **优先级抢占**：高优先级线程就绪时，会抢占低优先级线程的 CPU 资源（如 Java 中的`Thread.setPriority()`影响调度优先级）。

  ### 四、内核切换的 “代价”

  上下文切换不是免费的，主要开销包括：

  1. **直接开销**：保存 / 恢复线程状态的操作需要消耗 CPU 时间（虽然单次切换可能只有微秒级，但频繁切换会累积）。
  2. **间接开销**：CPU 缓存失效。每个线程有自己的局部变量和缓存数据，切换后 CPU 需要重新加载新线程的数据到缓存，导致缓存命中率下降，执行效率降低。

  ### 五、对 Java 多线程的影响与优化

  Java 多线程的性能很大程度上受内核切换频率影响：

  - **线程过多的问题**：如果创建的线程数远超过 CPU 核心数（比如 CPU 8 核，却创建 1000 个线程），线程会频繁切换，大部分 CPU 时间浪费在切换上，反而导致吞吐量下降。

  - 减少切换的优化方向

    ：

    1. 合理设置线程池大小（如`corePoolSize`根据 CPU 核心数调整，公式：CPU 核心数 ± 1 或 核心数 × 2）。
    2. 避免不必要的阻塞（如减少`synchronized`锁的持有时间，用非阻塞 IO 替代阻塞 IO）。
    3. 减少线程间竞争（如用`ConcurrentHashMap`替代`HashMap+synchronized`，降低锁竞争频率）。

  ### 总结

  Java 多线程依赖操作系统内核线程运行，“内核切换” 是操作系统调度不同线程时的状态切换过程。虽然切换是并发的基础，但频繁切换会消耗 CPU 资源。在 Java 编程中，合理控制线程数量、减少阻塞和竞争，能有效降低切换开销，提升多线程性能。

#### 三、线程等待 / 通知机制

1. **基础方法**

   - `wait()`：释放锁并阻塞，需在`synchronized`块中调用
   - `notify()`/`notifyAll()`：唤醒等待队列中的线程

2. **工具类**

   - CountDownLatch

     ：倒计时门闩，等待一组线程完成

     ```java
     CountDownLatch latch = new CountDownLatch(3);
     // 子线程执行完调用 latch.countDown();
     latch.await(); // 等待计数器归0
     ```
     
   - **CyclicBarrier**：循环屏障，等待所有线程到达屏障点再一起执行

   - **Semaphore**：信号量，控制并发访问资源的线程数

   - **Exchanger**：线程间数据交换工具

#### 四、AQS（AbstractQueuedSynchronizer）原理

​	AQS（AbstractQueuedSynchronizer，抽象队列同步器）是 Java 并发编程中的核心基础框架，是许多同步工具（如`ReentrantLock`、`CountDownLatch`、`Semaphore`等）的底层实现原理。它通过**状态管理**和**队列机制**，优雅地解决了多线程间的同步问题。

### AQS 核心原理

#### 1. 核心设计思想

AQS 基于**模板方法模式**设计，定义了一套同步状态管理和线程排队的通用机制，具体同步逻辑由子类实现。其核心包含两部分：

- **同步状态（State）**：一个 volatile 修饰的 int 变量，用于表示资源的占用状态（如锁的持有计数）。
- **同步队列（CLH 队列）**：一个双向链表实现的等待队列，用于存放因获取资源失败而阻塞的线程。
- **核心思想**：基于双向链表实现的同步队列 + 状态变量（state）
- 工作流程
  1. 线程尝试获取资源（`acquire()`），通过 CAS 修改 state
  2. 失败则封装为 Node 加入同步队列， park () 阻塞
  3. 释放资源（`release()`）时唤醒队列头节点，重新尝试获取
- **应用**：ReentrantLock、CountDownLatch、Semaphore 等同步工具的底层实现

#### 2. 核心组件

- **状态变量（state）**：

  ```java
private volatile int state; // 共享状态，volatile保证可见性
  ```
  
  子类通过`getState()`、`setState()`、`compareAndSetState()`（CAS 操作）来修改状态。

- **CLH 队列**：

  - 双向链表结构，每个节点（Node）代表一个等待线程。
  - 包含`prev`（前驱）、`next`（后继）指针，以及线程状态（如`CANCELLED`、`SIGNAL`等）。
  - 头节点（head）是已获取资源的线程，其他节点等待被唤醒。

#### 3. 核心流程（以独占锁为例）

- **获取资源（acquire）**：
  1. 线程尝试通过`tryAcquire(int arg)`获取资源（子类实现具体逻辑，如 ReentrantLock 的锁竞争）。
  2. 成功：直接返回。
  3. 失败：将线程封装为 Node 加入 CLH 队列，调用`park()`阻塞线程。
- **释放资源（release）**：
  1. 线程通过`tryRelease(int arg)`释放资源（子类实现）。
  2. 成功：唤醒队列中等待的线程（通常是头节点的后继节点），使其重新尝试获取资源。

#### 4. 两种模式

- **独占模式**：资源只能被一个线程持有（如`ReentrantLock`）。
- **共享模式**：资源可被多个线程同时持有（如`CountDownLatch`、`Semaphore`）。

### AQS 子类实现示例（简化版）

以`ReentrantLock`的非公平锁为例，其通过 AQS 实现的核心逻辑：

```java
// 自定义同步器（继承AQS）
private final Sync sync = new NonfairSync();

// 非公平锁同步器
static final class NonfairSync extends Sync {
    // 尝试获取锁（独占模式）
    protected boolean tryAcquire(int acquires) {
        final Thread current = Thread.currentThread();
        int c = getState();
        if (c == 0) { // 锁未被持有
            if (compareAndSetState(0, acquires)) { // CAS修改状态
                setExclusiveOwnerThread(current); // 标记当前线程持有锁
                return true;
            }
        }
        else if (current == getExclusiveOwnerThread()) { // 重入锁
            int nextc = c + acquires;
            setState(nextc);
            return true;
        }
        return false;
    }

    // 释放锁
    protected boolean tryRelease(int releases) {
        int c = getState() - releases;
        if (Thread.currentThread() != getExclusiveOwnerThread())
            throw new IllegalMonitorStateException();
        boolean free = false;
        if (c == 0) { // 完全释放锁
            free = true;
            setExclusiveOwnerThread(null);
        }
        setState(c);
        return free;
    }
}
```

### AQS 的核心价值

- **标准化**：统一了同步工具的实现逻辑，避免重复开发。
- **高效性**：基于 CAS 和队列机制，减少锁竞争带来的性能损耗。
- **灵活性**：支持独占 / 共享模式，可扩展出多种同步工具。

理解 AQS 是掌握 Java 并发编程的关键，它像一个 "同步骨架"，为上层同步工具提供了高效、可靠的底层支持。



#### 五、volatile 关键字

- 功能
  1. **可见性**：一个线程修改后，其他线程立即可见（禁用 CPU 缓存）
  2. **禁止指令重排序**：通过内存屏障保证有序性
- **局限性**：不保证原子性（如`i++`操作仍需锁）
- **应用场景**：状态标记（如`boolean isRunning`）、双重检查锁单例

#### 六、死锁处理

1. **查看死锁**
   - `jstack <pid>`：查看线程栈，搜索 "deadlock" 关键字
   - JConsole/VisualVM：线程面板检测死锁
2. **避免死锁**
   - 固定资源获取顺序（如按资源 ID 升序）
   - 限时获取锁（`tryLock(timeout)`）
   - 减少锁持有时间，避免嵌套锁
   - 使用`Lock`而非`synchronized`，可响应中断

#### 七、锁的分类

1. **乐观锁 vs 悲观锁**
   - 乐观锁：假设无冲突，操作时校验版本（如 CAS、版本号机制）
   - 悲观锁：假设一定冲突，先加锁再操作（如`synchronized`、`ReentrantLock`）
2. **公平锁 vs 非公平锁**
   - 公平锁：线程按请求顺序获取锁（AQS 队列实现）
   - 非公平锁：允许 "插队"，可能导致饥饿但性能更高（默认）
   - 示例：`ReentrantLock lock = new ReentrantLock(true);`（公平锁）

#### 八、ThreadLocal

- **功能**：为每个线程提供独立变量副本，实现线程隔离
- 核心方法
  - `set(T value)`：设置当前线程的变量值
  - `get()`：获取当前线程的变量值
  - `remove()`：清除当前线程的变量值（避免内存泄漏）
- 应用场景
  - 存储用户会话信息（如登录用户上下文）
  - 数据库连接管理（避免线程间共享 Connection）
- **注意**：线程池环境下需显式调用`remove()`，防止线程复用导致的数据混乱

### 总结

多线程编程的核心是**平衡并发效率与线程安全**。线程池通过合理配置可减少线程创建开销；AQS 是同步工具的基础；volatile 和各种锁机制用于保证可见性、原子性和有序性；ThreadLocal 实现线程隔离。实际开发中需根据场景选择合适的工具，同时警惕死锁、内存泄漏等问题。



##   JVM：内存结构，垃圾回收算法，如何定位解决oom异常，查看gc命令，堆栈信息，JVM调优经验；

### JVM 核心知识点总结

#### 一、JVM 内存结构

JVM 内存分为**线程私有**和**线程共享**两大区域：

1. **线程私有区域**（随线程创建 / 销毁）

   - **程序计数器**：记录当前线程执行的字节码行号，唯一不会 OOM 的区域

   - 虚拟机栈

     ：存储方法调用栈帧（局部变量表、操作数栈、动态链接等）

     - 栈深度过深会抛出 `StackOverflowError`（如递归无终止）
     - 栈扩展失败会抛出 `OutOfMemoryError`

   - **本地方法栈**：类似虚拟机栈，为 Native 方法服务

2. **线程共享区域**（所有线程共享）

   - 堆

     ：存储对象实例，GC 主要区域，分代划分：

     - 年轻代（Eden + Survivor0 + Survivor1）：新对象优先分配
     - 老年代：存活久的对象（默认年龄 15）、大对象直接进入

   - 方法区

     （JDK8 后为元空间 Metaspace）：存储类信息、常量、静态变量等

     - 元空间使用本地内存，默认无上限（可通过 `-XX:MaxMetaspaceSize` 限制）

#### 二、垃圾回收（GC）算法与收集器

1. **核心算法**
   - **标记 - 清除**：标记需回收对象，直接清除（缺点：内存碎片）
   - **标记 - 复制**：将存活对象复制到新区域，清除原区域（适合年轻代，如 Eden→Survivor）
   - **标记 - 整理**：标记后将存活对象移动到一端，清除剩余区域（适合老年代）
2. **经典收集器**
   - **SerialGC**：单线程收集，简单高效但停顿长（`-XX:+UseSerialGC`）
   - **ParallelGC**：多线程收集，注重吞吐量（`-XX:+UseParallelGC`，JDK8 默认）
   - **CMS**：并发标记清除，低延迟（`-XX:+UseConcMarkSweepGC`，已逐步被 G1 替代）
   - **G1**：区域化分代式，兼顾吞吐量和延迟（`-XX:+UseG1GC`，JDK9+ 默认）
   - **ZGC/Shenandoah**：超低延迟收集器，适合大堆场景

#### 三、OOM 异常定位与解决

1. **常见 OOM 类型**

   - `java.lang.OutOfMemoryError: Java heap space`：堆内存不足
   - `java.lang.OutOfMemoryError: Metaspace`：元空间溢出（类定义过多）
   - `java.lang.StackOverflowError`：栈深度超限（如无限递归）

2. **定位步骤**

   - 1. 开启堆转储：`-XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=./dump.hprof`

   - 1. 分析 dump 文件：使用 MAT（Memory Analyzer Tool）或 JProfiler

   - 1. 核心指标：

     - 查看大对象（如超大集合、未释放的缓存）
     - 检查对象引用链（是否存在内存泄漏）
     - 分析类加载数量（排查元空间溢出）

3. **解决策略**

   - 堆内存不足：调大堆空间（`-Xms2g -Xmx2g`），优化对象生命周期
   - 元空间溢出：调大元空间（`-XX:MetaspaceSize=256m -XX:MaxMetaspaceSize=512m`），减少类动态生成
   - 内存泄漏：修复对象未释放问题（如静态集合缓存未清理）

#### 四、查看 GC 与堆栈信息的命令

1. **JVM 进程信息**

   - `jps`：列出所有 Java 进程 ID
   - `jinfo <pid>`：查看 JVM 参数配置

2. **GC 状态监控**

   - ```
     jstat -gc <pid> <interval> <count>
     ```

     ：输出 GC 统计信息

     ```plaintext
     S0C    S1C    S0U    S1U      EC       EU        OC         OU       MC     MU    CCSC   CCSU   YGC     YGCT    FGC    FGCT     GCT   
     0.0   5120.0  0.0   5120.0  30720.0  15360.0   61440.0    30720.0   4480.0 4242.1 512.0  480.6      5    0.025   0      0.000    0.025
     ```
     
   - `jconsole`/`jvisualvm`：图形化工具监控 GC 趋势
   
3. **堆栈信息分析**

   - `jstack <pid>`：打印线程栈信息（排查死锁、线程阻塞）
   - `jmap -histo <pid>`：查看对象实例数量和大小
   - `jmap -dump:format=b,file=xxx.hprof <pid>`：手动生成堆转储文件

#### 五、JVM 调优经验

1. **参数调优原则**

   - 优先保证业务指标（吞吐量 / 延迟），而非盲目调大内存
   - 年轻代与老年代比例：默认 1:2（可通过 `-XX:NewRatio=2` 调整）
   - 初始堆 = 最大堆（`-Xms=-Xmx`），避免堆动态扩展开销

2. **分场景调优**

   - 高吞吐量场景

     （如后台任务）：

     - 选用 ParallelGC
     - 调大年轻代（`-Xmn`），减少 Minor GC 次数

   - 低延迟场景

     （如接口服务）：

     - 选用 G1/ZGC
     - 控制单次 GC 停顿（`-XX:MaxGCPauseMillis=200`）
     - 避免大对象直接进入老年代（`-XX:PretenureSizeThreshold=1m`）

3. **常见问题解决**

   - Minor GC 频繁：增大年轻代
   - Full GC 频繁：检查老年代对象是否可回收（如缓存对象是否及时清理）
   - 元空间持续增长：排查类加载器泄漏（如自定义类加载器未释放）

4. **监控指标**

   - 关注 GC 频率（如 Full GC 应低于 1 次 / 天）
   - 监控 GC 停顿时间（高并发服务应控制在 100ms 内）
   - 堆内存使用率稳定在 70% 左右为宜

### 总结

JVM 调优的核心是**理解内存模型与 GC 机制**，通过监控工具定位瓶颈，结合业务场景调整参数。实际调优中，应遵循 "监控 - 分析 - 调整 - 验证" 的循环，避免盲目优化。对于大多数应用，合理设置堆大小和选择合适的收集器，即可满足性能需求。



   ## 双亲委派机制

双亲委派机制是 Java 类加载器（ClassLoader）的核心工作机制，用于保证类加载的安全性和唯一性。其核心思想是 **“先委托父加载器加载，父加载器无法加载时再由子加载器自行加载”**。

### 一、双亲委派机制的工作流程

1. **委托过程**：当一个类加载器（ClassLoader）需要加载某个类时，它不会先自己尝试加载，而是**首先委托给其父加载器**。
2. **递归检查**：父加载器同样遵循这一规则，将请求向上传递，直到到达最顶层的启动类加载器（Bootstrap ClassLoader）。
3. **自行加载**：如果父加载器无法加载该类（在其搜索范围内未找到该类的.class 文件），则**子加载器才会尝试自己加载**。

简单来说：**“先找爸爸，爸爸不行再自己上”**。

### 二、Java 中的类加载器层次

双亲委派机制依赖于类加载器的层次结构，从顶层到下层依次为：

1. **启动类加载器（Bootstrap ClassLoader）**
   - 最顶层，由 C++ 实现（非 Java 类），负责加载 JVM 核心类库（如`rt.jar`、`resources.jar`等，位于`$JAVA_HOME/jre/lib`目录）。
   - 无法被 Java 代码直接引用，`getClassLoader()`返回`null`。
2. **扩展类加载器（Extension ClassLoader）**
   - 由 Java 实现（`sun.misc.Launcher$ExtClassLoader`），负责加载扩展类库（位于`$JAVA_HOME/jre/lib/ext`目录）。
3. **应用程序类加载器（Application ClassLoader）**
   - 由 Java 实现（`sun.misc.Launcher$AppClassLoader`），负责加载应用程序的类路径（`classpath`）下的类。
   - 是默认的类加载器，`Thread.currentThread().getContextClassLoader()`默认返回此加载器。
4. **自定义类加载器**
   - 开发者继承`ClassLoader`类实现，用于加载特定路径的类（如加载网络上的.class 文件）。

### 三、双亲委派机制的核心代码（简化版）

```java
protected Class<?> loadClass(String name, boolean resolve) throws ClassNotFoundException {
    synchronized (getClassLoadingLock(name)) {
        // 1. 检查该类是否已被当前加载器加载过
        Class<?> c = findLoadedClass(name);
        if (c == null) {
            long t0 = System.nanoTime();
            try {
                // 2. 委托父加载器加载
                if (parent != null) {
                    c = parent.loadClass(name, false);
                } else {
                    // 父加载器为null时，委托启动类加载器
                    c = findBootstrapClassOrNull(name);
                }
            } catch (ClassNotFoundException e) {
                // 父加载器无法加载
            }

            if (c == null) {
                // 3. 父加载器无法加载，自己尝试加载
                long t1 = System.nanoTime();
                c = findClass(name); // 子类需实现此方法
            }
        }
        if (resolve) {
            resolveClass(c);
        }
        return c;
    }
}
```

### 四、双亲委派机制的作用

1. **保证类的唯一性**：避免同一个类被不同加载器重复加载，确保类在 JVM 中的唯一性。
   - 例如，`java.lang.String`类只会被启动类加载器加载，任何自定义类加载器都无法加载自己定义的`java.lang.String`类（防止篡改核心类）。
2. **安全性**：防止恶意类冒充核心类（如自定义`java.lang.System`类），因为核心类会被顶层加载器优先加载，子加载器无法覆盖。
3. **类的层次一致性**：父加载器加载的类视为 “基础类”，子加载器加载的类依赖于基础类，保证了类之间的依赖关系正确。

### 五、打破双亲委派机制的场景

虽然双亲委派是默认机制，但某些场景下需要打破它：

1. **JNDI 服务**：JNDI 需要加载由应用程序类路径下的工厂类，需通过线程上下文类加载器（Thread Context ClassLoader）反向委托。
2. **OSGi 框架**：支持模块热部署，类加载器之间可平级委托（非严格父子关系）。
3. **Tomcat**：Web 应用之间的类隔离，每个 Web 应用有自己的类加载器，优先加载自身`WEB-INF/classes`下的类。

打破方式：重写`ClassLoader`的`loadClass()`方法，改变委托逻辑（不推荐，可能破坏安全性）。

### 总结

双亲委派机制是 Java 类加载的基础安全策略，通过层次化的委托模型，既保证了核心类的安全性，又确保了类的唯一性和依赖关系的正确性。理解这一机制，有助于排查类加载相关的问题（如`ClassNotFoundException`、类冲突等）。

​	

###   Equals 和== 的区别 equals和hashcode联系

在 Java 中，`equals`、`==`和`hashCode`是对象比较和哈希计算的核心概念，它们的区别和联系直接影响集合（如`HashMap`、`HashSet`）的行为。

### 一、`==` 与 `equals` 的区别

两者都用于比较对象，但比较的目标和逻辑完全不同：

| **维度**         | `==` 运算符                                              | `equals` 方法                                                |
| ---------------- | -------------------------------------------------------- | ------------------------------------------------------------ |
| **比较内容**     | 比较对象的**内存地址**（是否为同一个对象）。             | 比较对象的**实际内容**（默认与`==`一致，可重写）。           |
| **适用类型**     | 可用于基本类型和引用类型。                               | 仅用于引用类型（Object 类的方法）。                          |
| **基本类型行为** | 比较值是否相等（如 `int a=3; int b=3; a==b` 为`true`）。 | 不适用（基本类型没有方法）。                                 |
| **默认实现**     | 无（运算符本身的逻辑）。                                 | `Object`类中默认实现为 `return this == obj;`（即比较地址）。 |
| **可定制性**     | 不可重写（运算符逻辑固定）。                             | 可重写（通过重写定义对象内容相等的逻辑）。                   |

#### 示例说明：

```java
// 引用类型比较
String s1 = new String("abc");
String s2 = new String("abc");

// == 比较内存地址：s1和s2是不同对象，地址不同
System.out.println(s1 == s2); // false

// equals 比较内容：String重写了equals，比较字符串值
System.out.println(s1.equals(s2)); // true


// 基本类型比较（仅==适用）
int a = 5;
int b = 5;
System.out.println(a == b); // true（比较值）
```

- 对于`String`、`Integer`等包装类，`equals`被重写为比较内容；而自定义类若未重写`equals`，则默认与`==`行为一致。

### 二、`equals` 与 `hashCode` 的联系

`hashCode`是`Object`类的另一个方法，用于返回对象的哈希码（一个 int 值），主要用于哈希表（如`HashMap`）中快速定位对象。两者的核心联系由**Java 规范**规定：

#### 核心规则：

1. **一致性**：如果两个对象通过`equals`比较为`true`，则它们的`hashCode`必须**相等**。
   （反之不成立：`hashCode`相等的两个对象，`equals`可能为`false`，即哈希冲突）。
2. **稳定性**：同一对象在多次调用`hashCode`时，若对象信息未改变，返回的哈希码必须**相同**。
3. **非强制关联**：若两个对象`equals`为`false`，它们的`hashCode`**可以相同也可以不同**（但不同更优，可减少哈希冲突）。

#### 为什么需要这种联系？

哈希表（如`HashMap`）的工作依赖`hashCode`和`equals`的配合：

- 存储时：先通过`hashCode`定位对象所在的哈希桶（数组索引）。
- 查询时：先通过`hashCode`找到可能的桶，再通过`equals`逐个比较桶内对象，确认是否匹配。

**若违反规则（如`equals`为`true`但`hashCode`不同）**：
会导致哈希表中出现逻辑错误。例如，`HashMap`中两个相等的对象会被存入不同的桶，导致无法正确查询到已存在的对象。

#### 示例：重写`equals`必须重写`hashCode`

```java
class Person {
    private String name;
    private int age;

    // 重写equals：认为name和age相同则对象相等
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Person person = (Person) o;
        return age == person.age && Objects.equals(name, person.name);
    }

    // 必须同步重写hashCode：基于name和age计算哈希码
    @Override
    public int hashCode() {
        return Objects.hash(name, age); // 工具类自动组合字段计算哈希码
    }
}
```

- 若只重写`equals`而不重写`hashCode`，则两个`equals`为`true`的`Person`对象可能有不同的`hashCode`，导致在`HashSet`中被视为两个不同对象，违背逻辑。

### 三、总结

1. **`==` vs `equals`**：
   - `==`比较内存地址（引用是否相同），`equals`默认同`==`，可重写为比较内容。
   - 基本类型用`==`比较值，引用类型用`equals`比较内容（需重写）。
2. **`equals` vs `hashCode`**：
   - 核心原则：`equals`为`true` → `hashCode`必须相等；反之不强制。
   - 重写`equals`时必须同步重写`hashCode`，否则哈希表（如`HashMap`）会出现逻辑错误。

理解这些规则有助于正确设计对象比较逻辑，避免集合操作中的隐蔽 bug。

在 Java 中，重写`equals`方法时必须同时重写`hashCode`方法，这是由**哈希表的工作原理**和**Java 规范的约定**共同决定的，核心目的是保证**对象在哈希集合（如`HashMap`、`HashSet`）中的一致性**。

### 一、根本原因：哈希表依赖`hashCode`和`equals`的配合

哈希集合（如`HashSet`）和哈希映射（如`HashMap`）的核心功能是**快速查找、插入和删除元素**，其底层依赖 “哈希码（hashCode）” 实现高效定位：

1. **定位哈希桶**：当对象存入哈希表时，首先通过`hashCode`计算出一个 “哈希值”，用于确定对象存放的 “哈希桶”（数组中的位置）。
2. **桶内比对**：同一哈希桶中可能有多个对象（哈希冲突），此时通过`equals`方法逐个比较，确认对象是否已存在。

简言之：`hashCode`决定 “对象应该放在哪里”，`equals`决定 “这个位置上是不是目标对象”。

### 二、若只重写`equals`而不重写`hashCode`，会违反核心约定

Java 规范明确规定了`equals`和`hashCode`的关系：
**如果两个对象通过`equals`比较为`true`，则它们的`hashCode`必须返回相同的值**。

如果只重写`equals`而不重写`hashCode`，会导致：
两个`equals`为`true`的对象，`hashCode`可能不同（因为默认`hashCode`基于对象内存地址计算）。这会直接破坏哈希表的逻辑，引发如下问题：

#### 示例：只重写`equals`的后果

java

```java
class Person {
    private String id;

    // 重写equals：id相同则认为对象相等
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Person person = (Person) o;
        return Objects.equals(id, person.id);
    }

    // 未重写hashCode（使用Object默认实现，基于内存地址）
    // @Override
    // public int hashCode() { return Objects.hash(id); }

    public Person(String id) { this.id = id; }
}

public class Test {
    public static void main(String[] args) {
        Person p1 = new Person("123");
        Person p2 = new Person("123");

        // equals为true（id相同）
        System.out.println(p1.equals(p2)); // true

        // 但hashCode不同（默认基于内存地址）
        System.out.println(p1.hashCode()); // 比如：356573597
        System.out.println(p2.hashCode()); // 比如：1735600054

        // 将p1存入HashSet
        Set<Person> set = new HashSet<>();
        set.add(p1);

        // 尝试查找p2：因为hashCode不同，会定位到不同的哈希桶
        // 即使p2和p1 equals为true，也会被认为不存在于集合中
        System.out.println(set.contains(p2)); // false（逻辑错误！）
    }
}
```

上述示例中，`p1`和`p2`通过`equals`判断为相等（应视为同一个对象），但由于`hashCode`不同，`HashSet`会将它们视为两个不同的对象，导致`contains(p2)`返回`false`，这显然违背了逻辑预期。

### 三、总结：为何必须同时重写？

1. **遵守 Java 规范**：确保`equals`为`true`的对象，`hashCode`一定相同，这是 Java 对这两个方法的强制约定。
2. **保证哈希表正确性**：哈希集合 / 映射 / 映射依赖`hashCode`定位对象，若`hashCode`不一致，会导致相等的对象被误判为不同，引发查找失败、重复存储等问题。

**最佳实践**：重写`equals`时，务必基于`equals`中用于比较的所有字段，重写`hashCode`（可通过`Objects.hash(字段1, 字段2, ...)`便捷实现）。



 ###  设计模式 应用场景

设计模式是一套经过反复验证的、用于解决特定场景下软件设计问题的最佳实践。它能提高代码的可复用性、可维护性和扩展性。根据用途，设计模式可分为**创建型**、**结构型**和**行为型**三大类，以下是各类中常用模式及其典型应用场景：

### 一、创建型模式（关注对象的创建过程）

创建型模式用于解耦对象的创建和使用，隐藏对象创建的细节。

#### 1. 单例模式（Singleton）

- **核心思想**：确保一个类只有一个实例，并提供全局访问点。
- 应用场景
  - 全局配置类（如系统配置信息，只需要加载一次）。
  - 线程池、连接池（避免重复创建资源密集型对象）。
  - 日志工具类（确保日志输出的一致性，避免多实例导致的日志混乱）。
  - Spring 中的`@Service`、`@Component`默认是单例（无状态 Bean 的复用）。

#### 2. 工厂模式（Factory）

包括简单工厂、工厂方法、抽象工厂，核心是 “封装对象创建的逻辑”。

- **核心思想**：通过工厂类统一创建对象，而非直接用`new`，降低耦合。
- 应用场景
  - 日志框架（如`SLF4J`，通过工厂适配不同的日志实现（Log4j、Logback））。
  - 数据库驱动（`DriverManager`根据 URL 选择不同数据库的驱动实现）。
  - 支付系统（支付工厂根据支付类型（微信、支付宝）创建对应的支付对象）。

#### 3. 建造者模式（Builder）

- **核心思想**：将复杂对象的构建过程与表示分离，分步构建对象。
- 应用场景
  - 复杂对象的创建（如`StringBuilder`，分步拼接字符串）。
  - 实体类多参数构造（如 Lombok 的`@Builder`，避免 “telescoping constructor”（重叠构造器）问题）。
  - 配置对象构建（如 OkHttp 的`OkHttpClient.Builder`，通过链式调用设置超时、拦截器等参数）。

### 二、结构型模式（关注对象的组合与结构）

结构型模式用于处理类或对象的组合，实现更灵活的结构。

#### 1. 适配器模式（Adapter）

- **核心思想**：将一个类的接口转换成客户端期望的另一个接口，解决接口不兼容问题。
- 应用场景
  - 新旧系统集成（如老系统的接口与新系统不匹配，通过适配器适配）。
  - 第三方库适配（如 Java 的`InputStreamReader`，将字节流（`InputStream`）适配为字符流（`Reader`））。
  - 接口升级兼容（如版本迭代中，通过适配器让新接口兼容旧接口的调用方式）。

#### 2. 装饰器模式（Decorator）

- **核心思想**：动态给对象添加额外功能，不改变原类结构。
- 应用场景
  - IO 流（如`BufferedReader`装饰`FileReader`，增加缓冲功能；`GZIPOutputStream`装饰`OutputStream`，增加压缩功能）。
  - 日志增强（如在原有日志记录基础上，通过装饰器添加日志加密、脱敏功能）。
  - 权限控制（在核心业务方法外，通过装饰器添加权限校验逻辑）。

#### 3. 代理模式（Proxy）

- **核心思想**：为目标对象提供一个代理对象，控制对目标对象的访问（如增强、限制）。
- 应用场景
  - AOP（Spring AOP 通过动态代理（JDK 代理、CGLIB）在目标方法前后添加日志、事务等增强逻辑）。
  - 远程代理（RPC 框架中，通过代理对象屏蔽网络通信细节，让远程调用像本地调用一样）。
  - 延迟加载（如 Hibernate 的懒加载，通过代理对象在真正需要时才加载数据库数据）。
  - 权限代理（对敏感操作，通过代理判断用户权限，无权限则拒绝访问）。

### 三、行为型模式（关注对象的交互与职责分配）

行为型模式用于解决对象之间的通信和职责划分问题。

#### 1. 观察者模式（Observer）

- **核心思想**：定义对象间的一对多依赖，当一个对象状态变化时，所有依赖它的对象都会收到通知并自动更新。
- 应用场景
  - 事件通知（如 GUI 中的按钮点击事件，按钮（被观察者）通知所有注册的监听器（观察者）执行回调）。
  - 消息订阅（如 MQ 中的发布 - 订阅模式，生产者（被观察者）发送消息，所有订阅者（观察者）接收并处理）。
  - 状态同步（如分布式系统中的配置中心，配置更新后，所有订阅服务（观察者）自动刷新本地配置）。

#### 2. 策略模式（Strategy）

- **核心思想**：定义一系列算法，将每个算法封装起来，使它们可互换，客户端根据场景选择算法。
- 应用场景
  - 排序算法（如根据数据规模选择不同排序策略：小数据用冒泡，大数据用快排）。
  - 支付方式（订单系统中，根据用户选择的支付方式（微信、支付宝、银联）切换不同的支付策略）。
  - 日志输出策略（根据环境（开发 / 生产）选择不同的日志输出方式（控制台 / 文件 / 远程服务器））。

#### 3. 模板方法模式（Template Method）

- **核心思想**：在父类中定义算法的骨架（模板），将可变步骤延迟到子类实现，确保算法结构稳定。
- 应用场景
  - 框架设计（如 Spring 的`JdbcTemplate`，封装 JDBC 的固定流程（获取连接、释放资源），只让用户实现 SQL 执行和结果映射）。
  - 流程标准化（如测试用例模板：父类定义 “初始化 - 执行测试 - 清理” 流程，子类实现具体测试逻辑）。
  - 报表生成（固定 “数据查询 - 数据处理 - 报表渲染” 流程，子类根据报表类型实现具体处理逻辑）。

#### 4. 迭代器模式（Iterator）

- **核心思想**：提供一种方法遍历集合中的元素，而不暴露集合的内部结构。
- 应用场景
  - 集合框架（Java 的`Collection`接口继承`Iterable`，通过`iterator()`获取迭代器遍历 List、Set 等）。
  - 自定义容器（如自定义链表、树结构，通过迭代器统一遍历接口）。

### 四、设计模式的选择原则

- **不盲目套用**：设计模式是 “解决特定问题的工具”，而非必须使用的规范。简单场景用简单代码，复杂场景再考虑模式。
- **优先考虑扩展性**：当需求可能变化（如算法替换、对象结构调整）时，优先选择对应模式（如策略、适配器）。
- **结合框架学习**：很多框架内置了设计模式（如 Spring 的单例、代理；MyBatis 的工厂、建造者），通过源码理解模式的实际应用。

掌握设计模式的核心是理解其 “解决什么问题”，而非死记结构。在实际开发中，需根据业务场景灵活选择，实现 “写得少、改得少、扩展容易” 的代码。



  ### hashmap原理

HashMap 是 Java 中最常用的哈希表实现，用于存储键值对（Key-Value），其核心优势是**查询、插入、删除操作的平均时间复杂度接近 O (1)**。以下从数据结构、核心原理、扩容机制等方面详解其工作原理：

### 一、核心数据结构

HashMap 底层采用**数组 + 链表 / 红黑树**的复合结构（JDK 1.8 及以上）：

- **数组（哈希桶）**：数组中的每个元素称为 “桶（Bucket）”，用于存储链表或红黑树的头节点。数组长度默认是 16（必须是 2 的幂）。
- **链表**：当多个键（Key）计算出相同的哈希值（哈希冲突）时，这些键值对会以链表形式存储在同一个桶中。
- **红黑树**：当链表长度超过阈值（默认 8），且数组长度 ≥ 64 时，链表会转为红黑树（减少查询时间，从 O (n) 优化为 O (log n)）；当链表长度小于 6 时，红黑树会退化为链表。

### 二、核心原理：哈希计算与存储流程

#### 1. 哈希值计算

HashMap 通过以下步骤确定键（Key）在数组中的位置：

- 步骤 1：计算 Key 的哈希码（`hashCode()` 方法）。

- 步骤 2：对哈希码进行二次哈希（扰动函数），减少哈希冲突：

  ```java
static final int hash(Object key) {
      int h;
    // 二次哈希：将高16位与低16位异或，增强哈希值的随机性
      return (key == null) ? 0 : (h = key.hashCode()) ^ (h >>> 16);
}
  ```

- 步骤 3：计算数组索引：`index = (数组长度 - 1) & 二次哈希值`（等价于对数组长度取模，但效率更高）。

#### 2. 存储键值对（put 方法流程）

1. **计算索引**：通过上述哈希计算得到 Key 对应的数组索引。

2. 检查桶是否为空

   ：

   - 若桶为空，直接创建节点存入。

   - 若桶不为空，判断首个节点的 Key 是否与插入的 Key 相同（

     ```
     equals
     ```

      

     比较）：

     - 相同则覆盖旧值。
     - 不同则遍历链表 / 红黑树：
       - 找到相同 Key 则覆盖旧值。
       - 未找到则在链表尾部插入新节点（JDK 1.8 后）。

3. **扩容判断**：插入后若元素总数（size）超过阈值（`负载因子 × 数组长度`），触发扩容。

4. **树化判断**：若链表长度超过 8 且数组长度 ≥ 64，将链表转为红黑树。

### 三、扩容机制（Resize）

当 HashMap 中的元素数量超过 **阈值（threshold = 负载因子 × 数组长度）** 时，会触发扩容，流程如下：

1. **计算新容量**：新数组长度 = 旧容量 × 2（保证仍是 2 的幂）。
2. **重新哈希**：将旧数组中的所有键值对重新计算索引，放入新数组中（此过程称为 “rehash”）。
3. **更新阈值**：新阈值 = 新容量 × 负载因子（默认负载因子为 0.75）。

**为什么扩容为 2 倍？**
确保 `(新容量 - 1) & 哈希值` 能均匀分布索引，避免哈希冲突集中。

**负载因子的作用**：

- 负载因子越小（如 0.5）：哈希冲突少，空间利用率低。
- 负载因子越大（如 0.75）：空间利用率高，哈希冲突概率增加。
- 默认 0.75 是时间与空间的平衡。

### 四、关键参数

- `initialCapacity`：初始容量（默认 16），必须是 2 的幂。
- `loadFactor`：负载因子（默认 0.75），决定扩容时机。
- `threshold`：扩容阈值（`loadFactor × 容量`）。
- `TREEIFY_THRESHOLD`：链表转红黑树的阈值（默认 8）。
- `UNTREEIFY_THRESHOLD`：红黑树退化为链表的阈值（默认 6）。

### 五、线程安全性

HashMap **线程不安全**，多线程环境下可能出现以下问题：

- 扩容时可能形成环形链表（JDK 1.7 及之前），导致死循环。
- 插入元素时可能覆盖已有值或丢失数据。

**线程安全替代方案**：

- `ConcurrentHashMap`（推荐，高效并发）。
- `Collections.synchronizedMap(new HashMap<>())`（全局锁，效率低）。

### 六、与 Hashtable 的区别

| 特性             | HashMap                  | Hashtable                     |
| ---------------- | ------------------------ | ----------------------------- |
| 线程安全         | 不安全                   | 安全（方法加 `synchronized`） |
| 性能             | 高                       | 低（全局锁）                  |
| 允许的 Key/Value | Key 和 Value 均可为 null | 均不允许为 null               |
| 初始容量         | 16，扩容为 2 倍          | 11，扩容为 2 倍 + 1           |

### 总结

HashMap 的高效性源于**哈希表的快速定位**，通过数组存储桶、链表 / 红黑树解决哈希冲突，动态扩容保证性能稳定。理解其原理有助于合理设置初始容量（避免频繁扩容）、处理哈希冲突，以及在并发场景下选择正确的实现类。



  ###  红黑树

红黑树是一种自平衡的二叉搜索树（BST），它通过特定的规则保证树的高度始终维持在 O (log n) 级别，从而确保插入、删除、查询等操作的时间复杂度稳定在 O (log n)。相比普通二叉搜索树在极端情况下退化为链表（时间复杂度 O (n)），红黑树的自平衡特性使其在实际场景中（如 Java 的 `TreeMap`、`HashMap` 链表转树时）被广泛应用。

### 一、红黑树的核心特性

红黑树的节点除了存储键（Key）、值（Value）、左右子节点和父节点外，还多了一个**颜色属性**（红色或黑色）。通过以下 5 条规则，红黑树实现自平衡：

1. **节点颜色**：每个节点要么是红色，要么是黑色。
2. **根节点**：根节点必须是黑色。
3. **叶子节点**：所有叶子节点（NIL 节点，即空节点）都是黑色（实际实现中可能省略 NIL 节点，用 `null` 表示，但逻辑上仍视为黑色）。
4. **红色节点的子节点**：如果一个节点是红色，则它的两个子节点必须是黑色（即**不能有两个连续的红色节点**）。
5. **路径一致性**：从任意节点到其所有叶子节点的路径中，包含的黑色节点数量相同（称为 “黑高” 相等）。

### 二、红黑树的优势：为何需要自平衡？

普通二叉搜索树的性能依赖于树的高度。例如，当插入有序数据时，普通 BST 会退化为链表，导致查询效率从 O (log n) 降至 O (n)。
红黑树通过上述规则强制约束树的结构，确保**最长路径不超过最短路径的 2 倍**（因黑高相同，红色节点最多插入在黑色节点之间），从而保证树的高度始终为 O (log n)，维持高效操作。

### 三、红黑树的核心操作：插入与平衡调整

插入新节点时，红黑树默认将新节点设为**红色**（减少对 “黑高” 的影响，降低调整复杂度），然后通过以下步骤维护平衡：

#### 1. 插入流程

- 步骤 1：按二叉搜索树规则插入新节点（小于父节点放左子树，大于放右子树）。
- 步骤 2：检查是否违反红黑树规则（主要是 “连续红节点” 或 “根节点非黑”）。
- 步骤 3：若违反规则，通过**旋转**和**变色**调整，恢复平衡。

#### 2. 平衡调整：旋转与变色

当插入后出现 “红色父节点 + 红色子节点” 的违规情况（违反规则 4），需要根据 “叔叔节点”（父节点的兄弟节点）的颜色分情况处理：

##### （1）旋转操作

旋转是调整树结构的核心手段，分为**左旋**和**右旋**，目的是降低树的高度，改变节点的父子关系：

- 左旋

  ：以某个节点为支点，将其右子节点转为父节点，原右子节点的左子节点转为原节点的右子节点。

  plaintext

  ```plaintext
  左旋前       左旋后
    P           R
     \         /
      R   →   P
     /         \
    C           C
  ```
  
- **右旋**：以某个节点为支点，将其左子节点转为父节点，原左子节点的右子节点转为原节点的左子节点（与左旋对称）。

##### （2）分情况调整示例

假设新节点为 `N`（红），父节点为 `P`（红，因新节点为红，父节点若为黑则不违规），祖父节点为 `G`（必为黑，否则 P 和 G 连续红，早就违规了），叔叔节点为 `U`：

- **情况 1：叔叔 U 是红色**
  - 解决：将 `P` 和 `U` 改为黑色，`G` 改为红色（不影响黑高），然后以 `G` 为新节点继续向上检查（因 `G` 可能与它的父节点形成连续红）。
- **情况 2：叔叔 U 是黑色（或 NIL），且 N 是 P 的右子节点，P 是 G 的左子节点**
  - 解决：先对 `P` 左旋，将 `N` 转为 `P` 的父节点（此时变为情况 3），再按情况 3 处理。
- **情况 3：叔叔 U 是黑色（或 NIL），且 N 是 P 的左子节点，P 是 G 的左子节点**
  - 解决：对 `G` 右旋，将 `P` 改为黑色，`G` 改为红色（修复连续红，且黑高不变）。

通过以上调整，最终会恢复红黑树的 5 条规则。

### 四、红黑树 vs 其他平衡树（如 AVL 树）

| 特性     | 红黑树                       | AVL 树                           |
| -------- | ---------------------------- | -------------------------------- |
| 平衡标准 | 通过颜色规则保证 “黑高平衡”  | 严格保证左右子树高度差 ≤ 1       |
| 旋转次数 | 插入最多 2 次，删除最多 3 次 | 插入 / 删除可能多次旋转          |
| 适用场景 | 频繁插入 / 删除（旋转少）    | 频繁查询（更严格平衡，高度更低） |

红黑树的旋转操作更少，在插入删除频繁的场景（如 `HashMap` 中链表转树）更高效；AVL 树因更严格的平衡，查询速度略快，但维护成本更高。

### 五、红黑树的应用场景

- Java 集合：`TreeMap`（底层红黑树）、`HashMap`（JDK 1.8+ 中链表长度 ≥8 时转红黑树）。
- C++ STL：`map`、`set` 底层实现。
- Linux 内核：进程调度、虚拟内存管理等。
- 数据库索引：部分数据库用红黑树优化索引查询。

### 总结

红黑树通过 “颜色规则 + 旋转 + 变色” 实现自平衡，确保高效的增删改查操作，是平衡树中实用性极高的一种实现。理解其核心规则和调整逻辑，有助于深入掌握依赖它的底层组件（如 `HashMap` 的树化机制）。



3、开发工程能力：独立负责复杂模块、系统的开发工作，熟知核心业务指标含义； 10分钟 （基本线：50%）
   核心指标：qps，系统稳定性指标，tp99，机器配置；
   系统设计-运维把控，系统稳定性建设：限流（算法）、熔断、降级、监控、告警、项目部署结构；
   负载均衡策略， nginx设置；
4、设计及架构能力：独立完成子系统设计/完整系统设计；（2-3 / 3-1评判标准） 10分钟
   分布式理论：CAP、BASE；
   微服务拆分、子系统之间的领域边界；
   系统有高可扩展性；
   性能；
5、沟通表达能力：逻辑清晰，思维敏捷；



系统稳定性建设是保障服务在高并发、故障、资源紧张等场景下仍能正常运行的核心工程，需从**防护机制**（限流、熔断、降级）、**感知能力**（监控、告警）、**基础架构**（部署结构）三个维度协同设计。以下是各部分的核心要点：

### 一、限流：防止流量过载

限流（Rate Limiting）通过控制单位时间内的请求量，避免系统因流量突增（如秒杀、恶意攻击）而崩溃。核心是 “将流量控制在系统承载范围内”。

#### 1. 常见限流算法

| 算法           | 原理                                                         | 优点                               | 缺点                                       | 适用场景                                      |
| -------------- | ------------------------------------------------------------ | ---------------------------------- | ------------------------------------------ | --------------------------------------------- |
| **固定窗口**   | 将时间划分为固定窗口（如 1 秒），统计窗口内请求数，超过阈值则限流。 | 实现简单（计数器 + 时间戳）        | 临界问题（窗口边缘可能突发 2 倍阈值流量）  | 非核心场景，对精度要求低                      |
| **滑动窗口**   | 将固定窗口拆分为多个小窗口（如 1 秒拆分为 10 个 100ms 小窗口），滑动统计请求。 | 解决临界问题                       | 实现较复杂，小窗口越多精度越高但性能损耗大 | 对精度有一定要求的场景                        |
| **漏桶算法**   | 请求先进入 “漏桶”，桶以固定速率（如 100qps）处理请求，溢出则限流。 | 严格控制输出速率                   | 无法应对突发流量（即使系统空闲也不加速）   | 需严格控制请求速率的场景（如 API 调用第三方） |
| **令牌桶算法** | 系统按固定速率（如 100 个 / 秒）往桶中放令牌，请求需获取令牌才处理，桶有最大容量。 | 支持突发流量（桶满时可一次性处理） | 实现稍复杂                                 | 大多数场景（如 API 网关、接口限流）           |

#### 2. 实现方式

- 网关层限流

  ：通过 Nginx、Gateway 等网关统一拦截请求（如 Nginx 的limit_req 模块）。

  nginx

  ```nginx
  # Nginx 令牌桶思想限流（固定窗口+burst）
  limit_req_zone $binary_remote_addr zone=my_zone:10m rate=10r/s;
  server {
      location /api {
          limit_req zone=my_zone burst=20 nodelay; # 允许20个突发请求，不延迟
      }
  }
  ```

- 应用层限流

  ：通过代码实现（如 Guava 的

  ```
  RateLimiter
  ```

  、Resilience4j）

  ```java
  // Guava 令牌桶限流
  RateLimiter limiter = RateLimiter.create(100.0); // 100qps
  if (limiter.tryAcquire()) { // 尝试获取令牌
      // 处理请求
  } else {
      // 限流逻辑（返回503）
  }
  ```

- **分布式限流**：基于 Redis 实现（如 Redisson 的`RSemaphore`、自定义 Lua 脚本），解决集群环境下的限流一致性问题。

### 二、熔断：防止故障扩散

熔断（Circuit Breaker）用于当依赖服务频繁失败时，“快速失败” 并阻断请求，避免本地服务因等待或重试被拖垮，类似电路保险丝。

#### 1. 核心原理（熔断器模式）

熔断器有三个状态，通过状态转换实现故障隔离：

- **Closed（关闭）**：正常转发请求，统计失败率；当失败率超过阈值（如 50%），转为 Open 状态。
- **Open（打开）**：直接拒绝请求（返回降级结果），避免调用故障服务；经过一段 “冷却时间”（如 5 秒）后，转为 Half-Open 状态。
- **Half-Open（半开）**：允许少量请求尝试调用依赖服务；若成功，转为 Closed（恢复正常）；若失败，回到 Open 状态。

#### 2. 实现工具

- Hystrix

  （经典但已停更）：通过注解

  ```
  @HystrixCommand
  ```

  定义熔断和降级逻辑。

  java

  运行

  ```java
  @HystrixCommand(
      fallbackMethod = "queryFallback", // 降级方法
      commandProperties = {
          @HystrixProperty(name = "circuitBreaker.errorThresholdPercentage", value = "50"), // 失败率阈值
          @HystrixProperty(name = "circuitBreaker.sleepWindowInMilliseconds", value = "5000") // 冷却时间
      }
  )
  public Result queryData() {
      // 调用依赖服务
      return remoteService.query();
  }
  
  public Result queryFallback() {
      return Result.fail("服务暂时不可用，请稍后再试");
  }
  ```

- **Resilience4j**（轻量替代）：基于函数式编程，支持熔断、限流等多种功能。

- **Sentinel**（阿里开源）：结合限流、熔断、降级，支持控制台动态配置。

### 三、降级：牺牲非核心保核心

降级（Degradation）是在系统资源紧张（如 CPU / 内存过高）或依赖服务故障时，主动关闭非核心功能，释放资源保障核心功能（如电商系统 “关闭推荐商品” 保 “下单支付”）。

#### 1. 降级类型

- **主动降级**：系统监控到资源紧张（如 CPU>80%），主动触发降级（通过配置中心动态开关）。
- **被动降级**：依赖服务熔断 / 超时后，触发降级（如调用第三方物流超时，返回 “物流信息稍后更新”）。
- **限流降级**：请求被限流后，返回简化结果（如 “当前请求过多，请稍后再试”）。

#### 2. 降级策略

- **功能降级**：关闭非核心功能（如关闭评论、分享）。
- **数据降级**：返回缓存数据或默认值（如商品详情页返回缓存的旧数据）。
- **限流降级**：限制非核心接口的流量（如营销活动接口限流，保障下单接口）。

### 四、监控：全链路可见性

监控是稳定性的 “眼睛”，需覆盖**Metrics（指标）、Log（日志）、Trace（链路）** 三大维度，实现系统状态的全链路可视化。

#### 1. 核心监控指标（四大黄金指标）

- **延迟（Latency）**：请求处理时间（P50/P95/P99 分位值，关注长尾延迟）。
- **流量（Traffic）**：请求量（QPS/RPS）、并发用户数。
- **错误率（Errors）**：失败请求占比（如 HTTP 5xx/4xx 错误率）。
- **饱和度（Saturation）**：系统资源使用率（CPU、内存、磁盘 IO、网络带宽）。

#### 2. 监控工具链

- 指标监控

  ：Prometheus（采集存储）+ Grafana（可视化），监控系统 / 应用指标。

  - 应用指标：通过 Micrometer 暴露 JVM 指标（内存、GC）、业务指标（下单量、支付成功率）。

- **日志收集**：ELK（Elasticsearch+Logstash+Kibana）或 Loki，集中收集分析日志（如错误日志、业务日志）。

- **链路追踪**：Jaeger、Zipkin，追踪分布式调用链路（如微服务间的调用耗时、异常点）。

- **全链路监控**：SkyWalking、Pinpoint，整合 Metrics+Log+Trace，实现一站式监控。

### 五、告警：及时发现问题

告警是监控的延伸，需基于监控指标设置阈值，在系统异常时快速通知相关人员，避免问题扩大。

#### 1. 告警策略设计

- **阈值告警**：基于指标阈值（如 CPU>90%、错误率 > 1%、P99 延迟 > 500ms）。
- **趋势告警**：指标突增 / 突降（如 QPS 突然下降 50%、GC 频率异常升高）。
- **聚合告警**：多实例 / 多指标联合判断（如 3 个节点同时错误率超阈值才告警，减少噪音）。
- **抑制与升级**：重复告警抑制（如 5 分钟内同一告警只发一次），未处理则升级通知（如先短信，10 分钟未处理打电话）。

#### 2. 告警渠道

- 初级：邮件、钉钉 / 企业微信机器人（适合非紧急告警）。
- 中级：短信、电话（适合紧急告警，如核心接口错误率突增）。
- 高级：联动运维平台（如自动创建工单、触发扩容）。

### 六、项目部署结构：稳定性的基础保障

合理的部署结构是系统稳定的 “地基”，需从**高可用、隔离性、弹性**三个角度设计。

#### 1. 高可用部署

- **多副本部署**：核心服务至少 3 副本，避免单点故障（如 K8s Deployment 设置`replicas: 3`）。
- **跨机房 / 可用区**：服务部署在多个机房（AZ），单个机房故障不影响整体服务。
- **主从 / 集群模式**：中间件（数据库、Redis、MQ）采用主从或集群部署（如 MySQL 主从复制、Redis Cluster）。

#### 2. 隔离性设计

- **线程池隔离**：核心业务与非核心业务使用独立线程池（如 Hystrix 线程池隔离），避免非核心业务耗尽线程。
- **资源隔离**：核心服务独占服务器资源（如独立 VM / 容器），不与非核心服务共享。
- **集群隔离**：不同业务线使用独立集群（如电商的 “商品集群”“订单集群” 分开部署）。

#### 3. 弹性伸缩

- **自动扩缩容**：基于监控指标（如 CPU、QPS）自动调整实例数（如 K8s HPA：`targetCPUUtilizationPercentage: 70`）。
- **流量调度**：通过网关 / 负载均衡（如 Nginx、Ingress）动态将流量路由到健康实例。

#### 4. 灰度发布

通过灰度发布（金丝雀、蓝绿部署）降低变更风险：

- **金丝雀发布**：先将少量流量（如 5%）切到新版本，验证无问题后逐步扩大比例。
- **蓝绿部署**：新版本部署在 “绿环境”，验证通过后通过负载均衡瞬间切换流量（零停机）。

### 总结

系统稳定性建设是 “防护（限流 / 熔断 / 降级）+ 感知（监控 / 告警）+ 基础（部署结构）” 的有机整体：

- 限流防止流量过载，熔断防止故障扩散，降级保障核心功能；
- 监控提供全链路可见性，告警确保问题及时响应；
- 部署结构通过高可用、隔离性、弹性伸缩提供基础支撑。

实际落地需结合业务场景（如电商大促、金融交易）制定差异化策略，并通过混沌工程（如故障注入）持续验证系统稳定性。







Nginx 是一款高性能的 HTTP 服务器、反向代理服务器和负载均衡器，配置灵活且功能强大。以下是 Nginx 的核心配置解析和常见场景设置示例：

### 一、Nginx 基本配置结构

Nginx 配置文件（通常为 `nginx.conf`）的基本结构如下：

```nginx
# 全局配置（影响整个 Nginx 服务）
user nginx;                  # 运行用户
worker_processes auto;       # 工作进程数（建议设为 CPU 核心数）
error_log /var/log/nginx/error.log warn;  # 错误日志路径
pid /var/run/nginx.pid;      # 进程 PID 文件

# 事件模块配置（影响 Nginx 与用户的网络连接）
events {
    worker_connections 1024;  # 每个工作进程的最大连接数
    use epoll;                # 高效事件驱动模型（Linux 推荐）
}

# HTTP 核心模块配置（处理 HTTP 请求）
http {
    include /etc/nginx/mime.types;  # 媒体类型映射
    default_type application/octet-stream;

    # 日志格式定义
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    access_log /var/log/nginx/access.log main;  # 访问日志路径

    sendfile on;              # 启用高效文件传输模式
    tcp_nopush on;            # 配合 sendfile 使用，提高网络效率
    tcp_nodelay on;
    keepalive_timeout 65;     # 长连接超时时间
    types_hash_max_size 2048;

    include /etc/nginx/conf.d/*.conf;  # 引入子配置文件（推荐按站点拆分）
}
```

### 二、常见场景配置示例

#### 1. 静态资源服务器（部署前端项目）

将 Nginx 作为静态资源服务器，托管 HTML、CSS、JS、图片等文件：

nginx

```nginx
# 在 http 块中添加 server 配置（可放在 conf.d/default.conf 中）
server {
    listen 80;                 # 监听端口
    server_name example.com;   # 域名（可配置多个，用空格分隔）
    root /usr/share/nginx/html;  # 静态资源根目录
    index index.html index.htm;  # 默认首页

    # 字符编码设置
    charset utf-8;

    # 静态资源缓存配置（优化性能）
    location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
        expires 30d;  # 缓存 30 天
        add_header Cache-Control "public, max-age=2592000";
    }

    # 处理 404 错误
    error_page 404 /404.html;
    location = /404.html {
        internal;  # 仅内部访问，不允许外部直接请求
    }
}
```

#### 2. 反向代理（后端服务转发）

将请求转发到后端 API 服务（如 Java、Node.js 服务）：

nginx

```nginx
server {
    listen 80;
    server_name api.example.com;

    # 将所有请求转发到后端服务
    location / {
        proxy_pass http://127.0.0.1:8080;  # 后端服务地址
        proxy_set_header Host $host;       # 传递原始 Host 头
        proxy_set_header X-Real-IP $remote_addr;  # 传递客户端真实 IP
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;  # 传递协议（http/https）
    }

    # 转发特定路径（如 /api 开头的请求）
    location /api {
        proxy_pass http://127.0.0.1:9000;
        proxy_connect_timeout 30s;  # 连接超时时间
        proxy_read_timeout 60s;     # 读取超时时间
    }
}
```

#### 3. 负载均衡（分发请求到多台服务器）

通过 `upstream` 模块实现负载均衡，分发请求到多个后端节点：

nginx

```nginx
# 在 http 块中定义 upstream 集群
upstream backend_servers {
    server 192.168.1.101:8080 weight=3;  # weight 越大，分配的请求越多
    server 192.168.1.102:8080;
    server 192.168.1.103:8080 backup;    # backup：仅当主节点故障时启用
    # ip_hash;  # 按客户端 IP 哈希，确保同一客户端请求固定节点（适合会话保持）
    # least_conn;  # 优先分配到连接数少的节点
}

# 配置负载均衡的 server
server {
    listen 80;
    server_name www.example.com;

    location / {
        proxy_pass http://backend_servers;  # 转发到 upstream 集群
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

#### 4. HTTPS 配置（启用 SSL 证书）

配置 SSL 证书，实现 HTTPS 访问：

nginx

```nginx
server {
    listen 443 ssl;
    server_name example.com;

    # SSL 证书路径（需自行申请，如 Let's Encrypt）
    ssl_certificate /etc/nginx/ssl/example.com.crt;
    ssl_certificate_key /etc/nginx/ssl/example.com.key;

    # SSL 优化配置
    ssl_protocols TLSv1.2 TLSv1.3;  # 支持的 TLS 版本
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;  # SSL 会话缓存
    ssl_session_timeout 10m;

    # 转发到后端服务
    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
    }
}

# HTTP 自动跳转 HTTPS
server {
    listen 80;
    server_name example.com;
    return 301 https://$host$request_uri;  # 永久重定向到 HTTPS
}
```

#### 5. 限流配置（防止恶意请求）

通过 `limit_req` 模块限制请求频率：

```nginx
# 在 http 块中定义限流规则
limit_req_zone $binary_remote_addr zone=req_limit:10m rate=10r/s;
# $binary_remote_addr：客户端 IP 标识
# zone=req_limit:10m：创建名为 req_limit 的共享内存（10MB）
# rate=10r/s：限制每秒最多 10 个请求

server {
    listen 80;
    server_name example.com;

    # 应用限流规则
    location / {
        limit_req zone=req_limit burst=20 nodelay;
        # burst=20：允许 20 个请求排队等待
        # nodelay：超出速率的请求不延迟，直接返回 503
        proxy_pass http://127.0.0.1:8080;
    }
}
```

### 三、Nginx 常用命令

```bash
nginx -t          # 检查配置文件语法是否正确
nginx             # 启动 Nginx
nginx -s reload   # 重新加载配置（不中断服务）
nginx -s stop     # 快速停止 Nginx
nginx -s quit     # 优雅停止 Nginx（处理完当前请求）
```

### 四、最佳实践

1. **配置拆分**：将不同站点的配置放在 `conf.d/` 目录下（如 `site1.conf`、`site2.conf`），便于管理。
2. **日志轮转**：通过 `logrotate` 工具定期切割日志，避免日志文件过大。
3. **安全加固**：隐藏 Nginx 版本号（`server_tokens off;`）、限制请求体大小（`client_max_body_size 10m;`）。
4. **性能优化**：根据服务器配置调整 `worker_processes`、`worker_connections` 等参数，启用 `gzip` 压缩（`gzip on;`）。

Nginx 的配置灵活且强大，可根据实际需求（静态资源、反向代理、负载均衡等）组合上述模块，实现高性能、高可用的服务架构。