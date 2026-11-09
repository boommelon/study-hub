import{_ as a,o as n,c as p,a3 as t}from"./chunks/framework.Cc-oPviL.js";const h=JSON.parse('{"title":"05 · SQL 执行与优化","description":"","frontmatter":{},"headers":[],"relativePath":"bagu/db/05.md","filePath":"bagu/db/05.md"}'),e={name:"bagu/db/05.md"};function l(o,s,i,c,r,d){return n(),p("div",null,[...s[0]||(s[0]=[t(`<h1 id="_05-·-sql-执行与优化" tabindex="-1">05 · SQL 执行与优化 <a class="header-anchor" href="#_05-·-sql-执行与优化" aria-label="Permalink to &quot;05 · SQL 执行与优化&quot;">​</a></h1><blockquote><p>这篇是把前四篇&quot;用起来&quot;的地方。<strong>面试问&quot;一条 SQL 很慢怎么排查&quot;，考的就是这篇的综合运用。</strong></p></blockquote><h2 id="一句话本质" tabindex="-1">一句话本质 <a class="header-anchor" href="#一句话本质" aria-label="Permalink to &quot;一句话本质&quot;">​</a></h2><p>SQL 优化的全部工作，就是<strong>让数据库少读一些数据</strong>。少读 = 少 IO = 快。所有技巧都是这一句话的变体。</p><h2 id="生活类比-查资料" tabindex="-1">生活类比：查资料 <a class="header-anchor" href="#生活类比-查资料" aria-label="Permalink to &quot;生活类比：查资料&quot;">​</a></h2><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>慢的做法：</span></span>
<span class="line"><span>  把整个图书馆的书搬到桌上，一本本翻（全表扫描）</span></span>
<span class="line"><span></span></span>
<span class="line"><span>快的做法：</span></span>
<span class="line"><span>  先查索引柜，定位到&quot;3 排 2 号架&quot;，直接去拿（走索引）</span></span>
<span class="line"><span>  如果只需要&quot;作者和书名&quot;，卡片上就有，不用去拿书（覆盖索引）</span></span></code></pre></div><h2 id="核心机制" tabindex="-1">核心机制 <a class="header-anchor" href="#核心机制" aria-label="Permalink to &quot;核心机制&quot;">​</a></h2><h3 id="一、一条-sql-的执行流程-回顾-展开优化器" tabindex="-1">一、一条 SQL 的执行流程（回顾 + 展开优化器） <a class="header-anchor" href="#一、一条-sql-的执行流程-回顾-展开优化器" aria-label="Permalink to &quot;一、一条 SQL 的执行流程（回顾 + 展开优化器）&quot;">​</a></h3><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>① 连接器：TCP 握手（网络篇）、认证、权限</span></span>
<span class="line"><span>   v</span></span>
<span class="line"><span>② 解析器：词法 + 语法分析 &gt; 语法树</span></span>
<span class="line"><span>   v</span></span>
<span class="line"><span>③ 优化器：&lt; 这里决定 SQL 快不快</span></span>
<span class="line"><span>   a. 逻辑优化：子查询展开、谓词下推、常量折叠</span></span>
<span class="line"><span>   b. 物理优化：选哪个索引、join 用什么算法、join 顺序</span></span>
<span class="line"><span>   v</span></span>
<span class="line"><span>④ 执行器：调用存储引擎接口，逐行取数据</span></span>
<span class="line"><span>   v</span></span>
<span class="line"><span>⑤ 存储引擎：Buffer Pool &gt; B+ 树 &gt; 返回行</span></span></code></pre></div><p><strong>优化器是&quot;基于代价&quot;的</strong>（CBO）：它会估算每种执行计划的代价（主要看&quot;要读多少页&quot;），选代价最小的。</p><p><strong>为什么优化器会选错</strong>：</p><ul><li>统计信息过期（<code>ANALYZE TABLE</code> 可以更新）</li><li>数据分布不均（比如 99% 的行都是同一个值）</li><li>估算模型不精确（比如多列之间的相关性没考虑）</li></ul><h3 id="二、explain-必须会看" tabindex="-1">二、EXPLAIN：必须会看 <a class="header-anchor" href="#二、explain-必须会看" aria-label="Permalink to &quot;二、EXPLAIN：必须会看&quot;">​</a></h3><div class="language-sql vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">sql</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">EXPLAIN </span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">SELECT</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;"> *</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;"> FROM</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> user </span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">WHERE</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> age </span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">=</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> 20</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">;</span></span></code></pre></div><table tabindex="0"><thead><tr><th>列</th><th>含义</th><th>重点看什么</th></tr></thead><tbody><tr><td><strong>type</strong></td><td>访问类型</td><td><strong>最重要</strong>，从好到坏：<code>const &gt; eq_ref &gt; ref &gt; range &gt; index &gt; ALL</code></td></tr><tr><td><strong>key</strong></td><td>实际用的索引</td><td>为 NULL 说明没走索引</td></tr><tr><td><strong>rows</strong></td><td>预估扫描行数</td><td>越小越好</td></tr><tr><td><strong>filtered</strong></td><td>过滤后剩余百分比</td><td>越低说明过滤性越好</td></tr><tr><td><strong>Extra</strong></td><td>额外信息</td><td><code>Using index</code>（覆盖索引，好）、<code>Using filesort</code>（要排序，差）、<code>Using temporary</code>（用临时表，差）</td></tr></tbody></table><p><strong>type 的六个等级</strong>：</p><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>const     ：主键或唯一索引等值查询，最多一行        &lt; 最好</span></span>
<span class="line"><span>eq_ref    ：join 时用主键关联，每行只匹配一行</span></span>
<span class="line"><span>ref       ：普通索引等值查询，可能多行</span></span>
<span class="line"><span>range     ：索引范围查询（BETWEEN、&gt;、&lt;、IN）</span></span>
<span class="line"><span>index     ：扫描整个索引树（比全表快，因为索引小）</span></span>
<span class="line"><span>ALL       ：全表扫描                                &lt; 最差，要优化</span></span></code></pre></div><p><strong>看到 <code>type=ALL</code> 就说明要加索引了</strong>。</p><h3 id="三、慢查询的排查顺序-这是面试重点" tabindex="-1">三、慢查询的排查顺序（这是面试重点） <a class="header-anchor" href="#三、慢查询的排查顺序-这是面试重点" aria-label="Permalink to &quot;三、慢查询的排查顺序（这是面试重点）&quot;">​</a></h3><p><strong>不要一上来就说&quot;加索引&quot;</strong>。按这个顺序：</p><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>① 确认真的慢</span></span>
<span class="line"><span>   看慢查询日志（slow_query_log），确认执行时间、扫描行数</span></span>
<span class="line"><span></span></span>
<span class="line"><span>② 看执行计划</span></span>
<span class="line"><span>   EXPLAIN &gt; 看 type、key、rows、Extra</span></span>
<span class="line"><span>   - type=ALL &gt; 没走索引</span></span>
<span class="line"><span>   - rows 很大 &gt; 扫描行数多</span></span>
<span class="line"><span>   - Using filesort &gt; 需要额外排序</span></span>
<span class="line"><span>   - Using temporary &gt; 用了临时表（常见于 GROUP BY、子查询）</span></span>
<span class="line"><span></span></span>
<span class="line"><span>③ 判断是&quot;没索引&quot;还是&quot;索引没用上&quot;</span></span>
<span class="line"><span>   - 没索引 &gt; 建索引（注意区分度）</span></span>
<span class="line"><span>   - 有索引但没用 &gt; 检查索引失效的原因（函数、类型转换、前导模糊、OR）</span></span>
<span class="line"><span></span></span>
<span class="line"><span>④ 看是不是&quot;返回了太多数据&quot;</span></span>
<span class="line"><span>   - SELECT * &gt; 改成只查需要的列（可能实现覆盖索引）</span></span>
<span class="line"><span>   - LIMIT 分页太深 &gt; 用&quot;游标分页&quot;（WHERE id &gt; 上一页最后一条）</span></span>
<span class="line"><span></span></span>
<span class="line"><span>⑤ 看是不是&quot;锁等待&quot;</span></span>
<span class="line"><span>   - 查 information_schema.innodb_trx 看有没有长事务</span></span>
<span class="line"><span>   - 查 performance_schema 看锁等待</span></span>
<span class="line"><span></span></span>
<span class="line"><span>⑥ 看是不是&quot;数据量本身太大&quot;</span></span>
<span class="line"><span>   - 分库分表、冷热分离、归档历史数据</span></span>
<span class="line"><span></span></span>
<span class="line"><span>⑦ 看是不是&quot;数据库配置问题&quot;</span></span>
<span class="line"><span>   - Buffer Pool 太小、连接数不够、磁盘 IO 瓶颈</span></span></code></pre></div><p><strong>关键认知</strong>：<strong>慢 SQL 的原因不一定是 SQL 本身</strong>。可能是锁等待、可能是数据量、可能是硬件。</p><h3 id="四、join-的三种算法" tabindex="-1">四、Join 的三种算法 <a class="header-anchor" href="#四、join-的三种算法" aria-label="Permalink to &quot;四、Join 的三种算法&quot;">​</a></h3><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>① Nested Loop Join（嵌套循环）</span></span>
<span class="line"><span>   for each row in A:            &lt; 驱动表</span></span>
<span class="line"><span>     for each row in B:          &lt; 被驱动表</span></span>
<span class="line"><span>       if 匹配: 输出</span></span>
<span class="line"><span>   复杂度 O(A × B)</span></span>
<span class="line"><span>   优化：给 B 的关联列建索引 &gt; O(A × log B)</span></span>
<span class="line"><span></span></span>
<span class="line"><span>② Hash Join（MySQL 8.0.18+ 支持）</span></span>
<span class="line"><span>   把小表建成哈希表，扫大表去探测</span></span>
<span class="line"><span>   复杂度 O(A + B)，适合等值 join 且没有索引</span></span>
<span class="line"><span>   只能用于等值条件</span></span>
<span class="line"><span></span></span>
<span class="line"><span>③ Sort-Merge Join</span></span>
<span class="line"><span>   两边都排序，然后双指针合并</span></span>
<span class="line"><span>   适合有索引（已经有序）的情况</span></span></code></pre></div><p><strong>Join 的优化要点</strong>：</p><ul><li><strong>小表驱动大表</strong>（驱动表要全扫，被驱动表可以用索引）。</li><li><strong>关联列必须建索引</strong>，否则每一行都要全表扫被驱动表。</li><li><strong>避免 join 太多表</strong>（一般不超过 3 张），否则优化器的选择空间爆炸。</li></ul><h3 id="五、几个高频优化技巧" tabindex="-1">五、几个高频优化技巧 <a class="header-anchor" href="#五、几个高频优化技巧" aria-label="Permalink to &quot;五、几个高频优化技巧&quot;">​</a></h3><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>① 深分页优化</span></span>
<span class="line"><span>   SELECT * FROM t ORDER BY id LIMIT 1000000, 10;   ❌ 要扫 100 万行</span></span>
<span class="line"><span>   </span></span>
<span class="line"><span>   改成游标分页：</span></span>
<span class="line"><span>   SELECT * FROM t WHERE id &gt; 1000000 ORDER BY id LIMIT 10;   ✅</span></span>
<span class="line"><span>   </span></span>
<span class="line"><span>   或者延迟关联：</span></span>
<span class="line"><span>   SELECT t.* FROM t JOIN (SELECT id FROM t ORDER BY id LIMIT 1000000,10) x</span></span>
<span class="line"><span>     ON t.id = x.id;   ✅ 子查询走覆盖索引，只回表 10 次</span></span>
<span class="line"><span></span></span>
<span class="line"><span>② COUNT 优化</span></span>
<span class="line"><span>   COUNT(*) 会扫索引（不是全表），InnoDB 没有存总行数</span></span>
<span class="line"><span>   大表统计用近似值（SHOW TABLE STATUS 的 rows）或单独维护计数表</span></span>
<span class="line"><span></span></span>
<span class="line"><span>③ 批量插入</span></span>
<span class="line"><span>   一次插入 1000 条 &gt;&gt; 1000 次单条插入（减少网络往返和日志刷盘）</span></span>
<span class="line"><span></span></span>
<span class="line"><span>④ 避免 SELECT *</span></span>
<span class="line"><span>   浪费网络带宽、无法用覆盖索引、可能读到大字段（TEXT/BLOB）</span></span>
<span class="line"><span></span></span>
<span class="line"><span>⑤ 用 UNION ALL 代替 UNION（如果不需要去重）</span></span>
<span class="line"><span>   UNION 要去重 &gt; 需要排序/临时表</span></span>
<span class="line"><span></span></span>
<span class="line"><span>⑥ 把子查询改成 JOIN</span></span>
<span class="line"><span>   MySQL 对子查询的优化能力较弱，很多子查询会被改写成低效的半连接</span></span></code></pre></div><h3 id="六、范式与反范式" tabindex="-1">六、范式与反范式 <a class="header-anchor" href="#六、范式与反范式" aria-label="Permalink to &quot;六、范式与反范式&quot;">​</a></h3><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>第一范式（1NF）：字段原子性（不能是数组/嵌套）</span></span>
<span class="line"><span>第二范式（2NF）：非主键字段完全依赖主键（消除部分依赖）</span></span>
<span class="line"><span>第三范式（3NF）：非主键字段不依赖其他非主键字段（消除传递依赖）</span></span>
<span class="line"><span></span></span>
<span class="line"><span>范式的目的：消除冗余，避免更新异常</span></span>
<span class="line"><span></span></span>
<span class="line"><span>反范式：故意冗余，用空间换查询性能（避免 join）</span></span>
<span class="line"><span>  例：订单表冗余&quot;用户名&quot;，查订单时不用 join 用户表</span></span>
<span class="line"><span>  代价：用户名改了要同步更新所有订单</span></span></code></pre></div><p><strong>工程实践</strong>：<strong>读多写少的场景适度反范式</strong>。互联网业务通常&quot;查询性能优先&quot;，所以会冗余一些字段。</p><h2 id="为什么这么设计" tabindex="-1">为什么这么设计 <a class="header-anchor" href="#为什么这么设计" aria-label="Permalink to &quot;为什么这么设计&quot;">​</a></h2><h3 id="反事实-1-如果优化器不存在-sql-要手写执行计划" tabindex="-1">反事实 1：如果优化器不存在，SQL 要手写执行计划 <a class="header-anchor" href="#反事实-1-如果优化器不存在-sql-要手写执行计划" aria-label="Permalink to &quot;反事实 1：如果优化器不存在，SQL 要手写执行计划&quot;">​</a></h3><p>那开发者要自己决定&quot;用哪个索引、join 顺序、用什么算法&quot;——不可能，而且改数据量后计划就失效了。优化器让&quot;写 SQL&quot;和&quot;怎么执行&quot;解耦。</p><h3 id="反事实-2-如果-buffer-pool-很小" tabindex="-1">反事实 2：如果 Buffer Pool 很小 <a class="header-anchor" href="#反事实-2-如果-buffer-pool-很小" aria-label="Permalink to &quot;反事实 2：如果 Buffer Pool 很小&quot;">​</a></h3><p>每次查询都要读磁盘。Buffer Pool 命中率从 99% 降到 90%，IO 次数增加 10 倍，性能直接崩塌。<strong>Buffer Pool 大小通常是数据库最重要的配置项</strong>（一般设为物理内存的 60%~80%）。</p><h3 id="反事实-3-如果深分页用-limit-1000000-10" tabindex="-1">反事实 3：如果深分页用 <code>LIMIT 1000000, 10</code> <a class="header-anchor" href="#反事实-3-如果深分页用-limit-1000000-10" aria-label="Permalink to &quot;反事实 3：如果深分页用 \`LIMIT 1000000, 10\`&quot;">​</a></h3><p>数据库必须先读出前 1000010 行，然后<strong>丢掉前 100 万行</strong>。丢掉的行也读了、也消耗了 IO 和 CPU。这就是深分页慢的原因——<strong>它做了 100 万次无用功</strong>。</p><h2 id="面试怎么问" tabindex="-1">面试怎么问 <a class="header-anchor" href="#面试怎么问" aria-label="Permalink to &quot;面试怎么问&quot;">​</a></h2><p><strong>Q：一条 SQL 很慢，怎么排查？</strong></p><blockquote><p>按上面 ①~⑦ 的顺序答，<strong>不要一上来就说加索引</strong>。 重点：先 EXPLAIN 看 type 和 rows，再区分&quot;没索引&quot;还是&quot;索引失效&quot;，再考虑数据量和锁等待。</p></blockquote><p><strong>Q：EXPLAIN 你关注哪些字段？</strong></p><blockquote><p><code>type</code>（访问类型）、<code>key</code>（用了哪个索引）、<code>rows</code>（预估行数）、<code>Extra</code>（有没有 filesort / temporary）。</p></blockquote><p><strong>Q：为什么深分页慢？怎么优化？</strong></p><blockquote><p>因为要扫描并丢弃前面 N 行。优化：游标分页（<code>WHERE id &gt; ?</code>）或延迟关联（子查询走覆盖索引）。</p></blockquote><p><strong>Q：Join 怎么优化？</strong></p><blockquote><p>小表驱动大表、关联列建索引、控制 join 表数量。MySQL 8.0 之前只有 Nested Loop，所以要靠索引；8.0.18+ 有 Hash Join。</p></blockquote><p><strong>Q：什么是回表？怎么避免？</strong></p><blockquote><p>二级索引叶子只存主键，查其他列要回聚簇索引。用覆盖索引避免（把要查的列放进索引）。</p></blockquote><p><strong>追问链</strong>：</p><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>SQL 为什么慢？</span></span>
<span class="line"><span>  &gt; 怎么确认？（EXPLAIN 看 type / rows）</span></span>
<span class="line"><span>    &gt; type=ALL 说明什么？（没走索引）</span></span>
<span class="line"><span>      &gt; 有索引为什么不用？（函数、类型转换、前导模糊、区分度低）</span></span>
<span class="line"><span>        &gt; 走了索引还是慢？（回表太多 &gt; 覆盖索引）</span></span>
<span class="line"><span>          &gt; 数据量太大？（分库分表 / 归档）</span></span>
<span class="line"><span>            &gt; 不是 SQL 的问题？（锁等待 / Buffer Pool / 硬件）</span></span></code></pre></div><h2 id="和其他知识的连接" tabindex="-1">和其他知识的连接 <a class="header-anchor" href="#和其他知识的连接" aria-label="Permalink to &quot;和其他知识的连接&quot;">​</a></h2><ul><li><strong>&lt; 来自</strong> <a href="/study-hub/bagu/db/01">索引与 B+ 树</a>：优化器的核心工作就是&quot;选索引&quot;</li><li><strong>&lt; 来自</strong> <a href="/study-hub/bagu/db/02">事务与 ACID</a>：长事务导致 undo log 堆积，查询变慢</li><li><strong>&lt; 来自</strong> <a href="/study-hub/bagu/db/04">锁与死锁</a>：慢可能是锁等待，不一定是 SQL 本身</li><li><strong>&lt; 来自</strong> <a href="/study-hub/bagu/os/04">IO 模型与零拷贝：等设备的时候，CPU 在干什么</a>：Buffer Pool 命中率决定 IO 次数</li><li><strong>&gt; 影响</strong> 工程实践：读写分离、分库分表、缓存（Redis）、CQRS、冷热分离</li></ul><h2 id="自测-3-问" tabindex="-1">自测 3 问 <a class="header-anchor" href="#自测-3-问" aria-label="Permalink to &quot;自测 3 问&quot;">​</a></h2><p><strong>Q1：为什么 <code>LIMIT 1000000, 10</code> 很慢？</strong></p><details class="details custom-block"><summary>点开看答案</summary><p>因为 MySQL 的执行方式是&quot;<strong>先读、再丢</strong>&quot;。</p><p><code>LIMIT offset, n</code> 的语义是&quot;跳过 offset 行，取 n 行&quot;。但数据库没有&quot;直接跳到第 100 万行&quot;的能力（B+ 树只能按 key 定位，不能按&quot;第几行&quot;定位），所以它必须：</p><ol><li>从第一行开始，逐行读出来。</li><li>丢掉前 100 万行。</li><li>返回剩下的 10 行。</li></ol><p><strong>代价</strong>：读了 1000010 行，只用了 10 行。99.999% 的工作是浪费的。</p><p><strong>优化</strong>：</p><ul><li>游标分页：<code>WHERE id &gt; 上一页最后的id ORDER BY id LIMIT 10</code> &gt; 直接从 B+ 树定位到起点。</li><li>延迟关联：先在索引上取 10 个 id（覆盖索引，不用回表），再用这 10 个 id 回表取数据。</li></ul></details><p><strong>Q2：<code>COUNT(*)</code> 和 <code>COUNT(1)</code> 和 <code>COUNT(字段)</code> 有区别吗？</strong></p><details class="details custom-block"><summary>点开看答案</summary><p><strong>性能上</strong>：<code>COUNT(*)</code> 和 <code>COUNT(1)</code> 基本没区别（MySQL 优化器会把 <code>*</code> 当成 <code>1</code> 处理），都会选<strong>最小的索引</strong>来扫描。</p><p><strong>语义上</strong>：<code>COUNT(字段)</code> 有区别——它<strong>不统计 NULL</strong>。</p><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>表里有 3 行，其中 1 行的 name 是 NULL</span></span>
<span class="line"><span>COUNT(*)      &gt; 3</span></span>
<span class="line"><span>COUNT(1)      &gt; 3</span></span>
<span class="line"><span>COUNT(name)   &gt; 2   &lt; 跳过 NULL</span></span></code></pre></div><p><strong>性能上 <code>COUNT(字段)</code> 更差</strong>：如果字段没有索引，要回表读整行判断是否为 NULL；如果 <code>COUNT(*)</code> 可以用最小的二级索引，只扫索引就够。</p><p><strong>结论</strong>：统计行数用 <code>COUNT(*)</code>，别用 <code>COUNT(字段)</code>（除非你确实要排除 NULL）。</p></details><p><strong>Q3：为什么&quot;小表驱动大表&quot;？</strong></p><details class="details custom-block"><summary>点开看答案</summary><p>因为 Nested Loop Join 的代价是：</p><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>驱动表行数 × 被驱动表每次查找的代价</span></span></code></pre></div><ul><li><strong>驱动表</strong>：要<strong>全表扫描</strong>（或走索引扫描），每行都要处理。</li><li><strong>被驱动表</strong>：每一行驱动都要去查一次，如果关联列有索引，每次是 O(log n)。</li></ul><p>所以：</p><ul><li>驱动表小 &gt; 外层循环次数少 &gt; 总代价低。</li><li>被驱动表有索引 &gt; 内层查找快。</li></ul><p><strong>反过来</strong>（大表驱动小表）：外层循环 100 万次，每次都要查一次小表——即使小表只有 10 行，也要查 100 万次。</p><p><strong>例外</strong>：如果 join 的列在被驱动表上没有索引，那无论谁驱动都是 O(A×B)，此时&quot;小表驱动&quot;仍然更优（因为内存中的哈希表更小，如果优化器选 Hash Join 的话）。</p></details><h2 id="类比失效处-易错点" tabindex="-1">类比失效处 / 易错点 <a class="header-anchor" href="#类比失效处-易错点" aria-label="Permalink to &quot;类比失效处 / 易错点&quot;">​</a></h2><ul><li><strong>&quot;索引越多越快&quot;是错的</strong>。索引会拖慢写入（每次写要维护所有索引），且优化器要在多个索引间选择，太多反而增加选择成本。</li><li><strong><code>EXPLAIN</code> 的 rows 是估算值</strong>，不是精确值。它基于统计信息，可能偏差很大（尤其数据分布不均时）。</li><li><strong>优化器不一定选对索引</strong>。统计信息过期、数据倾斜时会选错，可以用 <code>FORCE INDEX</code> 强制（但要谨慎，数据变了可能更糟）。</li><li><strong>范式不是越高越好</strong>。互联网业务普遍反范式，因为 join 的代价比冗余高。</li><li><strong>&quot;加索引就能解决慢 SQL&quot;是最常见的错误答案</strong>。锁等待、数据量、Buffer Pool 配置、网络延迟都可能是原因。</li></ul><h2 id="✅-验收清单" tabindex="-1">✅ 验收清单 <a class="header-anchor" href="#✅-验收清单" aria-label="Permalink to &quot;✅ 验收清单&quot;">​</a></h2><ul><li class="sh-task-item"><input type="checkbox" class="sh-task" data-i="0"> 能完整讲出 SQL 的执行流程（连接器 &gt; 解析器 &gt; 优化器 &gt; 执行器 &gt; 引擎）</li><li class="sh-task-item"><input type="checkbox" class="sh-task" data-i="1"> 能说出 <code>EXPLAIN</code> 里 <code>type</code> 的六个等级，并知道哪个等级需要优化</li><li class="sh-task-item"><input type="checkbox" class="sh-task" data-i="2"> 能按顺序说出慢 SQL 的 7 步排查流程（不能一上来就说加索引）</li><li class="sh-task-item"><input type="checkbox" class="sh-task" data-i="3"> 能解释&quot;深分页为什么慢&quot;，并写出两种优化写法</li><li class="sh-task-item"><input type="checkbox" class="sh-task" data-i="4"> 能说出 Join 的三种算法和&quot;小表驱动大表&quot;的原因</li><li class="sh-task-item"><input type="checkbox" class="sh-task" data-i="5"> 能区分 <code>COUNT(*)</code> 和 <code>COUNT(字段)</code> 的语义与性能差异</li><li class="sh-task-item"><input type="checkbox" class="sh-task" data-i="6"> 能解释&quot;什么时候该反范式&quot;，并举一个具体例子</li><li class="sh-task-item"><input type="checkbox" class="sh-task" data-i="7"> 合上书，用自己的话讲 3 分钟，中途不卡壳</li></ul>`,64)])])}const u=a(e,[["render",l]]);export{h as __pageData,u as default};
