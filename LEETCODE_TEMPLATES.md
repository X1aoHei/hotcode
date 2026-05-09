# LeetCode Hot 100 核心模板（Java 版）

> 共 23 个模板，覆盖 Hot 100 中 90%+ 的题目。记住骨架，题目只是在骨架上加细节。

---

## 一、数组与哈希（4 个模板）

### 1. 两数之和型（哈希映射）

```java
// 核心：用哈希表存"需要什么"，边遍历边查找
public int[] twoSum(int[] nums, int target) {
    Map<Integer, Integer> seen = new HashMap<>(); // val -> index
    for (int i = 0; i < nums.length; i++) {
        int complement = target - nums[i];
        if (seen.containsKey(complement)) {
            return new int[]{seen.get(complement), i};
        }
        seen.put(nums[i], i);
    }
    return new int[]{};
}
```

**适用**：两数之和、四数相加

---

### 2. 前缀和

```java
// 核心：preSum[i] = nums[0] + ... + nums[i-1]
// 区间和 = preSum[j] - preSum[i]
public int subarraySum(int[] nums, int k) {
    int count = 0, prefix = 0;
    Map<Integer, Integer> seen = new HashMap<>();
    seen.put(0, 1); // 前缀和 -> 出现次数
    for (int n : nums) {
        prefix += n;
        count += seen.getOrDefault(prefix - k, 0);
        seen.put(prefix, seen.getOrDefault(prefix, 0) + 1);
    }
    return count;
}
```

**适用**：和为K的子数组、连续子数组和

---

### 3. 桶排序/抽屉原理

```java
// 核心：值当索引用，原地交换到对应位置
public int firstMissingPositive(int[] nums) {
    int n = nums.length;
    for (int i = 0; i < n; i++) {
        while (nums[i] > 0 && nums[i] <= n && nums[nums[i] - 1] != nums[i]) {
            int temp = nums[nums[i] - 1];
            nums[nums[i] - 1] = nums[i];
            nums[i] = temp;
        }
    }
    for (int i = 0; i < n; i++) {
        if (nums[i] != i + 1) return i + 1;
    }
    return n + 1;
}
```

**适用**：缺失的第一个正数

---

### 4. 矩阵螺旋/旋转

```java
// 核心：四边界收缩
public List<Integer> spiralOrder(int[][] matrix) {
    List<Integer> res = new ArrayList<>();
    int top = 0, bottom = matrix.length - 1;
    int left = 0, right = matrix[0].length - 1;
    while (top <= bottom && left <= right) {
        for (int i = left; i <= right; i++)   res.add(matrix[top][i]);
        top++;
        for (int i = top; i <= bottom; i++)   res.add(matrix[i][right]);
        right--;
        if (top > bottom) break;
        for (int i = right; i >= left; i--)   res.add(matrix[bottom][i]);
        bottom--;
        if (left > right) break;
        for (int i = bottom; i >= top; i--)   res.add(matrix[i][left]);
        left++;
    }
    return res;
}
```

**适用**：螺旋矩阵、旋转图像

---

## 二、双指针（3 个模板）

### 5. 左右夹逼

```java
// 核心：排序后，左右指针向中间收缩
public List<List<Integer>> threeSum(int[] nums) {
    Arrays.sort(nums);
    List<List<Integer>> res = new ArrayList<>();
    for (int i = 0; i < nums.length - 2; i++) {
        if (i > 0 && nums[i] == nums[i - 1]) continue; // 去重
        int lo = i + 1, hi = nums.length - 1;
        while (lo < hi) {
            int sum = nums[i] + nums[lo] + nums[hi];
            if (sum == 0) {
                res.add(Arrays.asList(nums[i], nums[lo], nums[hi]));
                while (lo < hi && nums[lo] == nums[lo + 1]) lo++; // 去重
                while (lo < hi && nums[hi] == nums[hi - 1]) hi--; // 去重
                lo++; hi--;
            } else if (sum < 0) lo++;
            else hi--;
        }
    }
    return res;
}
```

**适用**：三数之和、盛水容器、接雨水

---

### 6. 快慢指针

```java
// 核心：慢指针记录"有效位置"，快指针探索
public int removeDuplicates(int[] nums) {
    int slow = 0;
    for (int fast = 1; fast < nums.length; fast++) {
        if (nums[fast] != nums[slow]) {
            slow++;
            nums[slow] = nums[fast];
        }
    }
    return slow + 1;
}
```

**适用**：移除元素、移动零、环形链表

---

### 7. 滑动窗口

```java
// 核心：右指针扩展，左指针收缩，维护窗口性质
public int lengthOfLongestSubstring(String s) {
    int left = 0, maxLen = 0;
    Map<Character, Integer> window = new HashMap<>();
    for (int right = 0; right < s.length(); right++) {
        char c = s.charAt(right);
        window.put(c, window.getOrDefault(c, 0) + 1);
        while (window.get(c) > 1) { // 收缩条件
            char leftChar = s.charAt(left);
            window.put(leftChar, window.get(leftChar) - 1);
            left++;
        }
        maxLen = Math.max(maxLen, right - left + 1);
    }
    return maxLen;
}
```

**适用**：最长无重复子串、最小覆盖子串、字母异位词

---

## 三、链表（3 个模板）

### 8. 虚拟头节点

```java
// 核心：dummy 节点统一处理头节点边界
public ListNode removeElements(ListNode head, int val) {
    ListNode dummy = new ListNode(0, head);
    ListNode prev = dummy;
    while (prev.next != null) {
        if (prev.next.val == val) {
            prev.next = prev.next.next;
        } else {
            prev = prev.next;
        }
    }
    return dummy.next;
}
```

**适用**：合并链表、删除节点、分隔链表

---

### 9. 快慢指针找中点/环

```java
// 核心：fast 走两步，slow 走一步
public ListNode middleNode(ListNode head) {
    ListNode slow = head, fast = head;
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
    }
    return slow;
}

// 检测环
public boolean hasCycle(ListNode head) {
    ListNode slow = head, fast = head;
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
        if (slow == fast) return true;
    }
    return false;
}
```

**适用**：环形链表、回文链表、重排链表

---

### 10. 链表翻转

```java
// 核心：三指针 pre, cur, next 逐步翻转
public ListNode reverseList(ListNode head) {
    ListNode pre = null, cur = head;
    while (cur != null) {
        ListNode nxt = cur.next;
        cur.next = pre;
        pre = cur;
        cur = nxt;
    }
    return pre;
}
```

**适用**：反转链表、K个一组翻转

---

## 四、栈（2 个模板）

### 11. 单调栈

```java
// 核心：栈中维护递增/递减序列，找"下一个更大元素"
public int[] nextGreaterElement(int[] nums) {
    int n = nums.length;
    int[] res = new int[n];
    Arrays.fill(res, -1);
    Deque<Integer> stack = new ArrayDeque<>(); // 存索引，栈底到栈顶递减
    for (int i = 0; i < n; i++) {
        while (!stack.isEmpty() && nums[i] > nums[stack.peek()]) {
            int j = stack.pop();
            res[j] = nums[i];
        }
        stack.push(i);
    }
    return res;
}
```

**适用**：每日温度、柱状图最大矩形、接雨水

---

### 12. 括号/表达式栈

```java
// 核心：遇到左括号入栈，右括号出栈匹配
public boolean isValid(String s) {
    Deque<Character> stack = new ArrayDeque<>();
    Map<Character, Character> match = Map.of(')', '(', ']', '[', '}', '{');
    for (char c : s.toCharArray()) {
        if (match.containsKey(c)) {
            if (stack.isEmpty() || stack.peek() != match.get(c)) return false;
            stack.pop();
        } else {
            stack.push(c);
        }
    }
    return stack.isEmpty();
}
```

**适用**：有效括号、最小添加使括号有效

---

## 五、二叉树（3 个模板）

### 13. DFS 递归遍历

```java
// 核心：前/中/后序的区别仅在于"处理节点"的位置
public int maxDepth(TreeNode root) {
    if (root == null) return 0;
    int left = maxDepth(root.left);
    int right = maxDepth(root.right);
    return Math.max(left, right) + 1;
}

// 路径总和
public boolean hasPathSum(TreeNode root, int targetSum) {
    if (root == null) return false;
    if (root.left == null && root.right == null) return root.val == targetSum;
    return hasPathSum(root.left, targetSum - root.val)
        || hasPathSum(root.right, targetSum - root.val);
}
```

**适用**：最大深度、路径总和、翻转二叉树、对称二叉树

---

### 14. BFS 层序遍历

```java
// 核心：队列 + 逐层处理
public List<List<Integer>> levelOrder(TreeNode root) {
    List<List<Integer>> res = new ArrayList<>();
    if (root == null) return res;
    Queue<TreeNode> queue = new LinkedList<>();
    queue.offer(root);
    while (!queue.isEmpty()) {
        int size = queue.size(); // 当前层的节点数
        List<Integer> level = new ArrayList<>();
        for (int i = 0; i < size; i++) {
            TreeNode node = queue.poll();
            level.add(node.val);
            if (node.left != null)  queue.offer(node.left);
            if (node.right != null) queue.offer(node.right);
        }
        res.add(level);
    }
    return res;
}
```

**适用**：层序遍历、二叉树锯齿遍历、右视图

---

### 15. BST 中序递增性

```java
// 核心：BST 中序遍历 = 有序数组
TreeNode prev = null;
public boolean isValidBST(TreeNode root) {
    if (root == null) return true;
    if (!isValidBST(root.left)) return false;
    if (prev != null && prev.val >= root.val) return false;
    prev = root;
    return isValidBST(root.right);
}
```

**适用**：验证BST、二叉搜索树中第K小

---

## 六、图（2 个模板）

### 16. DFS 岛屿型

```java
// 核心：遍历到"1"就感染（标记为0），统计感染次数
public int numIslands(char[][] grid) {
    int count = 0;
    for (int i = 0; i < grid.length; i++) {
        for (int j = 0; j < grid[0].length; j++) {
            if (grid[i][j] == '1') {
                dfs(grid, i, j);
                count++;
            }
        }
    }
    return count;
}

private void dfs(char[][] grid, int i, int j) {
    if (i < 0 || j < 0 || i >= grid.length || j >= grid[0].length) return;
    if (grid[i][j] == '0') return;
    grid[i][j] = '0'; // 标记访问
    dfs(grid, i + 1, j);
    dfs(grid, i - 1, j);
    dfs(grid, i, j + 1);
    dfs(grid, i, j - 1);
}
```

**适用**：岛屿数量、腐烂的橘子、课程表（拓扑排序）

---

### 17. BFS 最短路径

```java
// 核心：队列逐层扩散，首次到达即最短
public int shortestPath(int[][] grid) {
    int[][] dirs = {{1,0},{-1,0},{0,1},{0,-1}};
    Queue<int[]> queue = new LinkedList<>();
    queue.offer(new int[]{0, 0, 0}); // {row, col, steps}
    boolean[][] visited = new boolean[grid.length][grid[0].length];
    visited[0][0] = true;
    while (!queue.isEmpty()) {
        int[] curr = queue.poll();
        int r = curr[0], c = curr[1], steps = curr[2];
        if (r == targetR && c == targetC) return steps;
        for (int[] d : dirs) {
            int nr = r + d[0], nc = c + d[1];
            if (nr >= 0 && nc >= 0 && nr < grid.length && nc < grid[0].length
                    && !visited[nr][nc] && grid[nr][nc] == 0) {
                visited[nr][nc] = true;
                queue.offer(new int[]{nr, nc, steps + 1});
            }
        }
    }
    return -1;
}
```

---

## 七、回溯（1 个模板解决所有）

### 18. 回溯框架

```java
// 核心：选择 → 递归 → 撤销（三步走）

// 实例：全排列
public List<List<Integer>> permute(int[] nums) {
    List<List<Integer>> res = new ArrayList<>();
    boolean[] used = new boolean[nums.length];
    backtrack(new ArrayList<>(), nums, used, res);
    return res;
}

private void backtrack(List<Integer> path, int[] nums, boolean[] used, List<List<Integer>> res) {
    if (path.size() == nums.length) {       // 满足结束条件
        res.add(new ArrayList<>(path));     // 注意要拷贝！
        return;
    }
    for (int i = 0; i < nums.length; i++) {
        if (used[i]) continue;              // 剪枝
        used[i] = true;                     // 做选择
        path.add(nums[i]);
        backtrack(path, nums, used, res);   // 递归
        path.remove(path.size() - 1);       // 撤销选择
        used[i] = false;
    }
}

// 实例：子集
public List<List<Integer>> subsets(int[] nums) {
    List<List<Integer>> res = new ArrayList<>();
    backtrack(new ArrayList<>(), nums, 0, res);
    return res;
}

private void backtrack(List<Integer> path, int[] nums, int start, List<List<Integer>> res) {
    res.add(new ArrayList<>(path));
    for (int i = start; i < nums.length; i++) {
        path.add(nums[i]);
        backtrack(path, nums, i + 1, res);
        path.remove(path.size() - 1);
    }
}
```

**适用**：全排列、子集、组合总和、N皇后、括号生成

---

## 八、动态规划（3 个核心模型）

### 19. 线性 DP（一维）

```java
// 核心：dp[i] 依赖前一个/几个状态

// 爬楼梯
public int climbStairs(int n) {
    if (n <= 2) return n;
    int[] dp = new int[n + 1];
    dp[1] = 1; dp[2] = 2;
    for (int i = 3; i <= n; i++) {
        dp[i] = dp[i - 1] + dp[i - 2];
    }
    return dp[n];
}

// 最长递增子序列 O(n²)
public int lengthOfLIS(int[] nums) {
    int n = nums.length;
    int[] dp = new int[n]; // dp[i] = 以 nums[i] 结尾的 LIS 长度
    Arrays.fill(dp, 1);
    int maxLen = 1;
    for (int i = 1; i < n; i++) {
        for (int j = 0; j < i; j++) {
            if (nums[j] < nums[i]) {
                dp[i] = Math.max(dp[i], dp[j] + 1);
            }
        }
        maxLen = Math.max(maxLen, dp[i]);
    }
    return maxLen;
}

// 最大子数组和（Kadane）
public int maxSubArray(int[] nums) {
    int cur = nums[0], max = nums[0];
    for (int i = 1; i < nums.length; i++) {
        cur = Math.max(nums[i], cur + nums[i]);
        max = Math.max(max, cur);
    }
    return max;
}
```

**适用**：爬楼梯、最长递增子序列、最大子数组和、打家劫舍

---

### 20. 背包 DP（二维 → 一维优化）

```java
// 核心：dp[w] = 容量 w 的最大价值

// 0-1 背包（逆序遍历容量）
public int knapsack(int[] weights, int[] values, int W) {
    int[] dp = new int[W + 1];
    for (int i = 0; i < weights.length; i++) {
        for (int w = W; w >= weights[i]; w--) { // 逆序！
            dp[w] = Math.max(dp[w], dp[w - weights[i]] + values[i]);
        }
    }
    return dp[W];
}

// 零钱兑换（完全背包 → 正序遍历）
public int coinChange(int[] coins, int amount) {
    int[] dp = new int[amount + 1];
    Arrays.fill(dp, amount + 1); // 初始化为不可能的值
    dp[0] = 0;
    for (int i = 1; i <= amount; i++) {
        for (int coin : coins) {
            if (i >= coin) {
                dp[i] = Math.min(dp[i], dp[i - coin] + 1);
            }
        }
    }
    return dp[amount] > amount ? -1 : dp[amount];
}

// 分割等和子集（0-1背包）
public boolean canPartition(int[] nums) {
    int sum = 0;
    for (int n : nums) sum += n;
    if (sum % 2 != 0) return false;
    int target = sum / 2;
    boolean[] dp = new boolean[target + 1];
    dp[0] = true;
    for (int num : nums) {
        for (int j = target; j >= num; j--) { // 逆序
            dp[j] = dp[j] || dp[j - num];
        }
    }
    return dp[target];
}
```

**适用**：零钱兑换、分割等和子集、目标和

---

### 21. 区间 DP / 字符串 DP

```java
// 核心：dp[i][j] 表示 s[i..j] 的最优解

// 最长回文子串
public String longestPalindrome(String s) {
    int n = s.length();
    boolean[][] dp = new boolean[n][n]; // dp[i][j] = s[i..j]是否回文
    int start = 0, maxLen = 1;
    for (int i = n - 1; i >= 0; i--) {        // i 从后往前
        for (int j = i; j < n; j++) {          // j 从 i 开始
            if (s.charAt(i) == s.charAt(j) && (j - i <= 2 || dp[i + 1][j - 1])) {
                dp[i][j] = true;
                if (j - i + 1 > maxLen) {
                    start = i;
                    maxLen = j - i + 1;
                }
            }
        }
    }
    return s.substring(start, start + maxLen);
}

// 最长公共子序列
public int longestCommonSubsequence(String text1, String text2) {
    int m = text1.length(), n = text2.length();
    int[][] dp = new int[m + 1][n + 1];
    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            if (text1.charAt(i - 1) == text2.charAt(j - 1)) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
            } else {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }
    return dp[m][n];
}
```

**适用**：最长回文子串、编辑距离、最长公共子序列

---

## 九、堆（1 个模板）

### 22. Top-K 问题

```java
import java.util.PriorityQueue;

// 最小堆找第K大（堆大小为K）
public int findKthLargest(int[] nums, int k) {
    PriorityQueue<Integer> minHeap = new PriorityQueue<>(k); // 默认最小堆
    for (int n : nums) {
        if (minHeap.size() < k) {
            minHeap.offer(n);
        } else if (n > minHeap.peek()) {
            minHeap.poll();
            minHeap.offer(n);
        }
    }
    return minHeap.peek();
}

// 前K个高频元素
public int[] topKFrequent(int[] nums, int k) {
    Map<Integer, Integer> freq = new HashMap<>();
    for (int n : nums) freq.put(n, freq.getOrDefault(n, 0) + 1);
    // 最小堆，按频率排序
    PriorityQueue<Integer> heap = new PriorityQueue<>(
        (a, b) -> freq.get(a) - freq.get(b)
    );
    for (int n : freq.keySet()) {
        heap.offer(n);
        if (heap.size() > k) heap.poll();
    }
    int[] res = new int[k];
    for (int i = 0; i < k; i++) res[i] = heap.poll();
    return res;
}

// 数据流中位数
class MedianFinder {
    PriorityQueue<Integer> small = new PriorityQueue<>(Collections.reverseOrder()); // 最大堆
    PriorityQueue<Integer> large = new PriorityQueue<>(); // 最小堆

    public void addNum(int num) {
        small.offer(num);
        large.offer(small.poll());
        if (large.size() > small.size()) {
            small.offer(large.poll());
        }
    }

    public double findMedian() {
        if (small.size() > large.size()) return small.peek();
        return (small.peek() + large.peek()) / 2.0;
    }
}
```

**适用**：前K个高频元素、数据流中位数

---

## 十、贪心（1 个思路）

### 23. 贪心选择

```java
// 核心：局部最优 → 全局最优

// 跳跃游戏
public boolean canJump(int[] nums) {
    int maxReach = 0;
    for (int i = 0; i < nums.length; i++) {
        if (i > maxReach) return false; // 当前位置不可达
        maxReach = Math.max(maxReach, i + nums[i]);
    }
    return true;
}

// 买卖股票的最佳时机 II（每天能买能卖）
public int maxProfit(int[] prices) {
    int profit = 0;
    for (int i = 1; i < prices.length; i++) {
        if (prices[i] > prices[i - 1]) {
            profit += prices[i] - prices[i - 1]; // 只要有涨幅就赚
        }
    }
    return profit;
}
```

**适用**：跳跃游戏、买卖股票的最佳时机

---

## 附录：Java 常用数据结构速查

```java
// 哈希表
Map<Integer, Integer> map = new HashMap<>();
map.put(k, v);          map.get(k);
map.containsKey(k);     map.getOrDefault(k, defaultVal);

// 栈
Deque<Integer> stack = new ArrayDeque<>();
stack.push(x);          stack.pop();         stack.peek();

// 队列
Queue<Integer> queue = new LinkedList<>();
queue.offer(x);         queue.poll();        queue.peek();

// 最小堆（默认）
PriorityQueue<Integer> minHeap = new PriorityQueue<>();
minHeap.offer(x);       minHeap.poll();      minHeap.peek();

// 最大堆
PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Collections.reverseOrder());

// 排序
Arrays.sort(nums);
Arrays.sort(nums, (a, b) -> b - a); // 降序

// List
List<Integer> list = new ArrayList<>();
list.add(x);            list.remove(list.size() - 1); // 删除末尾
```

---

## 汇总速查表

| # | 模板 | 关键词 | 复杂度特征 |
|---|------|-------|-----------|
| 1 | 哈希映射 | 两数之和 | O(n) |
| 2 | 前缀和 | 区间和 | O(n) |
| 3 | 桶/抽屉 | 值当索引 | O(n) |
| 4 | 矩阵遍历 | 四边界 | O(m x n) |
| 5 | 左右夹逼 | 排序+双指针 | O(n) |
| 6 | 快慢指针 | 去重/找环 | O(n) |
| 7 | 滑动窗口 | 子串/子数组 | O(n) |
| 8 | 虚拟头节点 | 链表边界 | O(n) |
| 9 | 快慢找中点 | 链表 | O(n) |
| 10 | 链表翻转 | 三指针 | O(n) |
| 11 | 单调栈 | 下一个更大 | O(n) |
| 12 | 括号栈 | 匹配 | O(n) |
| 13 | DFS递归 | 树深度/路径 | O(n) |
| 14 | BFS层序 | 逐层 | O(n) |
| 15 | BST中序 | 有序 | O(n) |
| 16 | DFS岛屿 | 感染标记 | O(m x n) |
| 17 | BFS最短 | 队列扩散 | O(V+E) |
| 18 | 回溯 | 选-递归-撤 | 指数级 |
| 19 | 线性DP | 状态转移 | O(n)~O(n²) |
| 20 | 背包DP | 选或不选 | O(n x W) |
| 21 | 区间DP | 子问题分割 | O(n²) |
| 22 | 堆/TopK | 优先队列 | O(nlogk) |
| 23 | 贪心 | 局部最优 | O(n)~O(nlogn) |
