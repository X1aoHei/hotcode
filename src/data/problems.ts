import type { Problem } from '@/types/problem'

/**
 * LeetCode 热题 Hot 100 题库。
 * 数据按官方分类整理，前若干题包含完整解题思路与参考代码，
 * 其余题目保留题面与标签，思路/代码字段可在后续逐题补全。
 */
export const problems: Problem[] = [
  // ========== 哈希 ==========
  {
    id: 1,
    title: '两数之和',
    slug: 'two-sum',
    difficulty: 'Easy',
    tags: ['哈希', '数组'],
    description:
      '给定一个整数数组 nums 和一个整数目标值 target，请你在该数组中找出和为目标值 target 的那两个整数，并返回它们的数组下标。你可以假设每种输入只会对应一个答案，且同一个元素不能使用两遍。',
    approach:
      '一次遍历 + 哈希表：遍历过程中，对每个数 x 检查 target - x 是否已在哈希表中；若在，直接返回两者下标；否则把 x 与下标记入表中。',
    code: `function twoSum(nums: number[], target: number): number[] {
  const map = new Map<number, number>()
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i]
    if (map.has(need)) return [map.get(need)!, i]
    map.set(nums[i], i)
  }
  return []
}`,
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(n)'
  },
  {
    id: 49,
    title: '字母异位词分组',
    slug: 'group-anagrams',
    difficulty: 'Medium',
    tags: ['哈希', '字符串', '排序'],
    description: '给你一个字符串数组，请你将字母异位词组合在一起。可以按任意顺序返回结果列表。',
    approach: '把每个字符串排序后作为 key 存入哈希表，相同 key 的归为一组。也可用长度 26 的计数数组作为 key。',
    code: `function groupAnagrams(strs: string[]): string[][] {
  const map = new Map<string, string[]>()
  for (const s of strs) {
    const key = [...s].sort().join('')
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(s)
  }
  return [...map.values()]
}`,
    timeComplexity: 'O(n·k log k)',
    spaceComplexity: 'O(n·k)'
  },
  {
    id: 128,
    title: '最长连续序列',
    slug: 'longest-consecutive-sequence',
    difficulty: 'Medium',
    tags: ['哈希', '并查集'],
    description: '给定一个未排序的整数数组 nums，找出数字连续的最长序列（不要求序列元素在原数组中连续）的长度。要求时间复杂度 O(n)。',
    approach: '把所有数放入 Set。遍历每个数 x，仅当 x-1 不在 Set 时（说明 x 是序列起点）开始向后计数，避免重复枚举。',
    code: `function longestConsecutive(nums: number[]): number {
  const set = new Set(nums)
  let best = 0
  for (const x of set) {
    if (set.has(x - 1)) continue
    let cur = x, len = 1
    while (set.has(cur + 1)) { cur++; len++ }
    best = Math.max(best, len)
  }
  return best
}`,
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(n)'
  },

  // ========== 双指针 ==========
  {
    id: 283,
    title: '移动零',
    slug: 'move-zeroes',
    difficulty: 'Easy',
    tags: ['双指针', '数组'],
    description: '给定一个数组 nums，编写一个函数将所有 0 移动到数组的末尾，同时保持非零元素的相对顺序。必须在原地操作。',
    approach: '快慢指针：慢指针指向下一个非零应放位置，快指针扫描数组；遇到非零元素与慢指针交换并推进慢指针。',
    code: `function moveZeroes(nums: number[]): void {
  let slow = 0
  for (let fast = 0; fast < nums.length; fast++) {
    if (nums[fast] !== 0) {
      [nums[slow], nums[fast]] = [nums[fast], nums[slow]]
      slow++
    }
  }
}`,
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)'
  },
  {
    id: 11,
    title: '盛最多水的容器',
    slug: 'container-with-most-water',
    difficulty: 'Medium',
    tags: ['双指针', '贪心'],
    description: '给定 n 个非负整数，每个数代表一根垂线的高度。找出两条线，使它们与 x 轴共同构成的容器可以容纳最多的水。',
    approach: '左右指针向中间收缩，每次移动较矮的那一侧（移动较高一侧不可能让面积变大）。',
    code: `function maxArea(height: number[]): number {
  let l = 0, r = height.length - 1, best = 0
  while (l < r) {
    const area = Math.min(height[l], height[r]) * (r - l)
    best = Math.max(best, area)
    height[l] < height[r] ? l++ : r--
  }
  return best
}`,
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)'
  },
  {
    id: 15,
    title: '三数之和',
    slug: '3sum',
    difficulty: 'Medium',
    tags: ['双指针', '排序'],
    description: '给你一个整数数组 nums，判断是否存在三元组 [a,b,c] 使得 a+b+c=0，并返回所有不重复的三元组。',
    approach: '排序后固定第一个数 i，剩下两个数用左右双指针在 [i+1, n-1] 中寻找；过程中跳过相同值去重。',
    code: `function threeSum(nums: number[]): number[][] {
  nums.sort((a, b) => a - b)
  const res: number[][] = []
  for (let i = 0; i < nums.length - 2; i++) {
    if (i > 0 && nums[i] === nums[i - 1]) continue
    let l = i + 1, r = nums.length - 1
    while (l < r) {
      const s = nums[i] + nums[l] + nums[r]
      if (s === 0) {
        res.push([nums[i], nums[l], nums[r]])
        while (l < r && nums[l] === nums[l + 1]) l++
        while (l < r && nums[r] === nums[r - 1]) r--
        l++; r--
      } else if (s < 0) l++
      else r--
    }
  }
  return res
}`,
    timeComplexity: 'O(n²)',
    spaceComplexity: 'O(log n)'
  },
  {
    id: 42,
    title: '接雨水',
    slug: 'trapping-rain-water',
    difficulty: 'Hard',
    tags: ['双指针', '动态规划', '单调栈'],
    description: '给定 n 个非负整数表示每个宽度为 1 的柱子的高度图，计算按此排列的柱子下雨之后能接多少雨水。',
    approach: '左右双指针 + 维护两侧最大值：哪边高度小，就由该侧主导，将其侧的最大高度减去当前高度累加进答案。',
    code: `function trap(height: number[]): number {
  let l = 0, r = height.length - 1
  let lMax = 0, rMax = 0, ans = 0
  while (l < r) {
    if (height[l] < height[r]) {
      lMax = Math.max(lMax, height[l])
      ans += lMax - height[l]
      l++
    } else {
      rMax = Math.max(rMax, height[r])
      ans += rMax - height[r]
      r--
    }
  }
  return ans
}`,
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)'
  },

  // ========== 滑动窗口 ==========
  {
    id: 3,
    title: '无重复字符的最长子串',
    slug: 'longest-substring-without-repeating-characters',
    difficulty: 'Medium',
    tags: ['滑动窗口', '哈希'],
    description: '给定一个字符串 s，请你找出其中不含有重复字符的最长子串的长度。',
    approach: '滑动窗口 + 哈希表记录字符上次出现位置；右指针每次推进，若字符在窗口内出现，则把左指针跳到上次位置之后。',
    code: `function lengthOfLongestSubstring(s: string): number {
  const last = new Map<string, number>()
  let l = 0, best = 0
  for (let r = 0; r < s.length; r++) {
    if (last.has(s[r]) && last.get(s[r])! >= l) l = last.get(s[r])! + 1
    last.set(s[r], r)
    best = Math.max(best, r - l + 1)
  }
  return best
}`,
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(min(n,Σ))'
  },
  {
    id: 438,
    title: '找到字符串中所有字母异位词',
    slug: 'find-all-anagrams-in-a-string',
    difficulty: 'Medium',
    tags: ['滑动窗口', '哈希'],
    description: '给定两个字符串 s 和 p，找到 s 中所有 p 的字母异位词的子串，返回这些子串的起始索引。',
    approach: '固定大小为 |p| 的滑动窗口，比较窗口内字母频次数组与 p 的频次数组是否相等。',
    code: `function findAnagrams(s: string, p: string): number[] {
  if (s.length < p.length) return []
  const cs = new Array(26).fill(0), cp = new Array(26).fill(0)
  const A = 'a'.charCodeAt(0)
  for (let i = 0; i < p.length; i++) {
    cp[p.charCodeAt(i) - A]++
    cs[s.charCodeAt(i) - A]++
  }
  const res: number[] = []
  if (cs.every((v, i) => v === cp[i])) res.push(0)
  for (let i = p.length; i < s.length; i++) {
    cs[s.charCodeAt(i) - A]++
    cs[s.charCodeAt(i - p.length) - A]--
    if (cs.every((v, j) => v === cp[j])) res.push(i - p.length + 1)
  }
  return res
}`,
    timeComplexity: 'O(n·Σ)',
    spaceComplexity: 'O(Σ)'
  },

  // ========== 子串 ==========
  {
    id: 560,
    title: '和为 K 的子数组',
    slug: 'subarray-sum-equals-k',
    difficulty: 'Medium',
    tags: ['前缀和', '哈希'],
    description: '给你一个整数数组 nums 和一个整数 k，请你统计并返回该数组中和为 k 的连续子数组的个数。',
    approach: '前缀和 + 哈希：枚举右端点，累加前缀和 sum，若 sum-k 出现过则说明存在以当前位置结尾的子数组。',
    code: `function subarraySum(nums: number[], k: number): number {
  const cnt = new Map<number, number>([[0, 1]])
  let sum = 0, ans = 0
  for (const x of nums) {
    sum += x
    ans += cnt.get(sum - k) ?? 0
    cnt.set(sum, (cnt.get(sum) ?? 0) + 1)
  }
  return ans
}`,
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(n)'
  },
  {
    id: 239,
    title: '滑动窗口最大值',
    slug: 'sliding-window-maximum',
    difficulty: 'Hard',
    tags: ['滑动窗口', '单调队列'],
    description: '给你一个整数数组 nums，有一个大小为 k 的滑动窗口从数组的最左侧移动到最右侧。返回每次窗口中的最大值。',
    approach: '单调递减双端队列：队首即当前窗口最大值；新元素入队前从队尾弹出更小的；队首过期则出队。',
    code: `function maxSlidingWindow(nums: number[], k: number): number[] {
  const dq: number[] = [], res: number[] = []
  for (let i = 0; i < nums.length; i++) {
    while (dq.length && nums[dq[dq.length - 1]] <= nums[i]) dq.pop()
    dq.push(i)
    if (dq[0] <= i - k) dq.shift()
    if (i >= k - 1) res.push(nums[dq[0]])
  }
  return res
}`,
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(k)'
  },
  {
    id: 76,
    title: '最小覆盖子串',
    slug: 'minimum-window-substring',
    difficulty: 'Hard',
    tags: ['滑动窗口', '哈希'],
    description: '给你一个字符串 s 和一个字符串 t。返回 s 中涵盖 t 所有字符的最小子串。',
    approach: '滑动窗口 + 计数：右扩直到包含 t 全部字符；再左缩至刚好不满足，用一个 need 计数器衡量是否仍满足。',
    code: `function minWindow(s: string, t: string): string {
  const need = new Map<string, number>()
  for (const c of t) need.set(c, (need.get(c) ?? 0) + 1)
  let missing = t.length, l = 0, start = 0, len = Infinity
  for (let r = 0; r < s.length; r++) {
    if ((need.get(s[r]) ?? 0) > 0) missing--
    need.set(s[r], (need.get(s[r]) ?? 0) - 1)
    while (missing === 0) {
      if (r - l + 1 < len) { len = r - l + 1; start = l }
      need.set(s[l], (need.get(s[l]) ?? 0) + 1)
      if ((need.get(s[l]) ?? 0) > 0) missing++
      l++
    }
  }
  return len === Infinity ? '' : s.slice(start, start + len)
}`,
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(Σ)'
  },

  // ========== 普通数组 ==========
  {
    id: 53,
    title: '最大子数组和',
    slug: 'maximum-subarray',
    difficulty: 'Medium',
    tags: ['动态规划', '分治'],
    description: '给你一个整数数组 nums，请你找出一个具有最大和的连续子数组（子数组最少包含一个元素），返回其最大和。',
    approach: 'Kadane 算法：dp[i] 表示以 i 结尾的最大和，dp[i] = max(dp[i-1]+nums[i], nums[i])。',
    code: `function maxSubArray(nums: number[]): number {
  let cur = nums[0], best = nums[0]
  for (let i = 1; i < nums.length; i++) {
    cur = Math.max(cur + nums[i], nums[i])
    best = Math.max(best, cur)
  }
  return best
}`,
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)'
  },
  {
    id: 56,
    title: '合并区间',
    slug: 'merge-intervals',
    difficulty: 'Medium',
    tags: ['排序', '数组'],
    description: '以数组 intervals 表示若干个区间的集合，请你合并所有重叠的区间，并返回一个不重叠的区间数组。',
    approach: '按起点排序，依次比较当前区间与结果末尾区间：可合并则更新右端，否则追加。',
    code: `function merge(intervals: number[][]): number[][] {
  intervals.sort((a, b) => a[0] - b[0])
  const res: number[][] = []
  for (const [s, e] of intervals) {
    if (res.length && res[res.length - 1][1] >= s) {
      res[res.length - 1][1] = Math.max(res[res.length - 1][1], e)
    } else res.push([s, e])
  }
  return res
}`,
    timeComplexity: 'O(n log n)',
    spaceComplexity: 'O(log n)'
  },
  {
    id: 189,
    title: '轮转数组',
    slug: 'rotate-array',
    difficulty: 'Medium',
    tags: ['数组', '双指针'],
    description: '给定一个整数数组 nums，将数组中的元素向右轮转 k 个位置，其中 k 是非负数。',
    approach: '三次反转法：先整体反转，再反转前 k 个，再反转后 n-k 个。',
    code: `function rotate(nums: number[], k: number): void {
  k %= nums.length
  const reverse = (l: number, r: number) => {
    while (l < r) { [nums[l], nums[r]] = [nums[r], nums[l]]; l++; r-- }
  }
  reverse(0, nums.length - 1)
  reverse(0, k - 1)
  reverse(k, nums.length - 1)
}`,
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)'
  },
  {
    id: 238,
    title: '除自身以外数组的乘积',
    slug: 'product-of-array-except-self',
    difficulty: 'Medium',
    tags: ['数组', '前缀积'],
    description: '给你一个整数数组 nums，返回数组 answer，其中 answer[i] 等于 nums 中除 nums[i] 之外其余元素的乘积。要求 O(n) 且不使用除法。',
    approach: '两次遍历：先把左侧前缀积写入 answer；再用变量从右往左维护右侧后缀积乘进 answer[i]。',
    code: `function productExceptSelf(nums: number[]): number[] {
  const n = nums.length, res = new Array(n).fill(1)
  for (let i = 1; i < n; i++) res[i] = res[i - 1] * nums[i - 1]
  let right = 1
  for (let i = n - 1; i >= 0; i--) {
    res[i] *= right
    right *= nums[i]
  }
  return res
}`,
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)'
  },
  {
    id: 41,
    title: '缺失的第一个正数',
    slug: 'first-missing-positive',
    difficulty: 'Hard',
    tags: ['数组', '原地哈希'],
    description: '给你一个未排序的整数数组 nums，请你找出其中没有出现的最小的正整数。要求时间 O(n) 空间 O(1)。',
    approach: '原地哈希：把每个值 v∈[1,n] 交换到下标 v-1 处；最后扫描，第一个不匹配的位置即为答案。',
    code: `function firstMissingPositive(nums: number[]): number {
  const n = nums.length
  for (let i = 0; i < n; i++) {
    while (nums[i] >= 1 && nums[i] <= n && nums[nums[i] - 1] !== nums[i]) {
      const j = nums[i] - 1
      ;[nums[i], nums[j]] = [nums[j], nums[i]]
    }
  }
  for (let i = 0; i < n; i++) if (nums[i] !== i + 1) return i + 1
  return n + 1
}`,
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)'
  },

  // ========== 矩阵 ==========
  {
    id: 73,
    title: '矩阵置零',
    slug: 'set-matrix-zeroes',
    difficulty: 'Medium',
    tags: ['矩阵'],
    description: '给定一个 m x n 的矩阵，如果某个元素为 0，则将其所在行和列的所有元素都设为 0。请使用原地算法。',
    approach: '使用首行首列作为标记位；先单独记录首行首列是否需置零，再遍历内部用首行首列标记，最后回写。',
    code: `function setZeroes(matrix: number[][]): void {
  const m = matrix.length, n = matrix[0].length
  let firstRow = false, firstCol = false
  for (let j = 0; j < n; j++) if (matrix[0][j] === 0) firstRow = true
  for (let i = 0; i < m; i++) if (matrix[i][0] === 0) firstCol = true
  for (let i = 1; i < m; i++)
    for (let j = 1; j < n; j++)
      if (matrix[i][j] === 0) { matrix[i][0] = 0; matrix[0][j] = 0 }
  for (let i = 1; i < m; i++)
    for (let j = 1; j < n; j++)
      if (matrix[i][0] === 0 || matrix[0][j] === 0) matrix[i][j] = 0
  if (firstRow) for (let j = 0; j < n; j++) matrix[0][j] = 0
  if (firstCol) for (let i = 0; i < m; i++) matrix[i][0] = 0
}`,
    timeComplexity: 'O(mn)',
    spaceComplexity: 'O(1)'
  },
  {
    id: 54,
    title: '螺旋矩阵',
    slug: 'spiral-matrix',
    difficulty: 'Medium',
    tags: ['矩阵', '模拟'],
    description: '给你一个 m 行 n 列的矩阵 matrix，请按照顺时针螺旋顺序，返回矩阵中的所有元素。',
    approach: '维护四条边界 top/bottom/left/right，按右→下→左→上顺序逐圈遍历；每完成一边收缩对应边界。',
    code: `function spiralOrder(matrix: number[][]): number[] {
  const res: number[] = []
  let t = 0, b = matrix.length - 1, l = 0, r = matrix[0].length - 1
  while (t <= b && l <= r) {
    for (let j = l; j <= r; j++) res.push(matrix[t][j])
    t++
    for (let i = t; i <= b; i++) res.push(matrix[i][r])
    r--
    if (t <= b) {
      for (let j = r; j >= l; j--) res.push(matrix[b][j])
      b--
    }
    if (l <= r) {
      for (let i = b; i >= t; i--) res.push(matrix[i][l])
      l++
    }
  }
  return res
}`,
    timeComplexity: 'O(mn)',
    spaceComplexity: 'O(1)'
  },
  {
    id: 48,
    title: '旋转图像',
    slug: 'rotate-image',
    difficulty: 'Medium',
    tags: ['矩阵'],
    description: '给定一个 n × n 的二维矩阵表示一个图像，请你将图像顺时针旋转 90 度，必须原地修改。',
    approach: '先沿主对角线转置，再左右翻转每一行，即等价于顺时针 90°。',
    code: `function rotate(matrix: number[][]): void {
  const n = matrix.length
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++)
      [matrix[i][j], matrix[j][i]] = [matrix[j][i], matrix[i][j]]
  for (const row of matrix) row.reverse()
}`,
    timeComplexity: 'O(n²)',
    spaceComplexity: 'O(1)'
  },
  {
    id: 240,
    title: '搜索二维矩阵 II',
    slug: 'search-a-2d-matrix-ii',
    difficulty: 'Medium',
    tags: ['矩阵', '二分'],
    description: '编写一个高效的算法来搜索 m x n 矩阵中的一个目标值 target。该矩阵每行从左到右递增，每列从上到下递增。',
    approach: '从右上角开始：当前值 > target 则左移，< target 则下移，相等则命中。',
    code: `function searchMatrix(matrix: number[][], target: number): boolean {
  let i = 0, j = matrix[0].length - 1
  while (i < matrix.length && j >= 0) {
    if (matrix[i][j] === target) return true
    if (matrix[i][j] > target) j--
    else i++
  }
  return false
}`,
    timeComplexity: 'O(m+n)',
    spaceComplexity: 'O(1)'
  },

  // ========== 链表 ==========
  {
    id: 160,
    title: '相交链表',
    slug: 'intersection-of-two-linked-lists',
    difficulty: 'Easy',
    tags: ['链表', '双指针'],
    description: '给你两个单链表的头节点 headA 和 headB，请你找出并返回两个单链表相交的起始节点。如果不存在则返回 null。',
    approach: '双指针走 a+b 等长路径：A 走完接 B，B 走完接 A，相遇点即为交点（或同时为 null）。',
    code: `function getIntersectionNode(headA: any, headB: any): any {
  let a = headA, b = headB
  while (a !== b) {
    a = a ? a.next : headB
    b = b ? b.next : headA
  }
  return a
}`,
    timeComplexity: 'O(m+n)',
    spaceComplexity: 'O(1)'
  },
  {
    id: 206,
    title: '反转链表',
    slug: 'reverse-linked-list',
    difficulty: 'Easy',
    tags: ['链表'],
    description: '给你单链表的头节点 head，请你反转链表，并返回反转后的链表。',
    approach: '迭代：维护 prev、cur 指针，依次断开当前节点 next，指向 prev，再前移。',
    code: `function reverseList(head: any): any {
  let prev = null, cur = head
  while (cur) {
    const next = cur.next
    cur.next = prev
    prev = cur
    cur = next
  }
  return prev
}`,
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)'
  },
  {
    id: 234,
    title: '回文链表',
    slug: 'palindrome-linked-list',
    difficulty: 'Easy',
    tags: ['链表', '双指针'],
    description: '给你一个单链表的头节点 head，请你判断该链表是否为回文链表。要求 O(n) 时间和 O(1) 空间。',
    approach: '快慢指针找中点 → 反转后半段 → 双指针比较前后两半。',
    code: `function isPalindrome(head: any): boolean {
  let slow = head, fast = head
  while (fast && fast.next) { slow = slow.next; fast = fast.next.next }
  let prev = null, cur = slow
  while (cur) { const n = cur.next; cur.next = prev; prev = cur; cur = n }
  let l = head, r = prev
  while (r) { if (l.val !== r.val) return false; l = l.next; r = r.next }
  return true
}`,
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)'
  },
  {
    id: 141,
    title: '环形链表',
    slug: 'linked-list-cycle',
    difficulty: 'Easy',
    tags: ['链表', '双指针'],
    description: '给你一个链表的头节点 head，判断链表中是否有环。',
    approach: 'Floyd 快慢指针：快指针每次走两步，慢指针走一步；若有环必相遇。',
    code: `function hasCycle(head: any): boolean {
  let slow = head, fast = head
  while (fast && fast.next) {
    slow = slow.next
    fast = fast.next.next
    if (slow === fast) return true
  }
  return false
}`,
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)'
  },
  {
    id: 142,
    title: '环形链表 II',
    slug: 'linked-list-cycle-ii',
    difficulty: 'Medium',
    tags: ['链表', '双指针'],
    description: '给定一个链表的头节点 head，返回链表开始入环的第一个节点。如果链表无环，返回 null。',
    approach: 'Floyd 算法：相遇后将一个指针放回头，与原慢指针同速前进，再次相遇处即为环入口。',
    code: `function detectCycle(head: any): any {
  let slow = head, fast = head
  while (fast && fast.next) {
    slow = slow.next
    fast = fast.next.next
    if (slow === fast) {
      let p = head
      while (p !== slow) { p = p.next; slow = slow.next }
      return p
    }
  }
  return null
}`,
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)'
  },
  {
    id: 21,
    title: '合并两个有序链表',
    slug: 'merge-two-sorted-lists',
    difficulty: 'Easy',
    tags: ['链表', '递归'],
    description: '将两个升序链表合并为一个新的升序链表并返回。新链表是通过拼接给定的两个链表的所有节点组成的。',
    approach: '哨兵节点 + 双指针：哪个小哪个先接到尾部；最后接上剩余部分。',
    code: `function mergeTwoLists(l1: any, l2: any): any {
  const dummy: any = { next: null }
  let cur = dummy
  while (l1 && l2) {
    if (l1.val <= l2.val) { cur.next = l1; l1 = l1.next }
    else { cur.next = l2; l2 = l2.next }
    cur = cur.next
  }
  cur.next = l1 ?? l2
  return dummy.next
}`,
    timeComplexity: 'O(m+n)',
    spaceComplexity: 'O(1)'
  },
  {
    id: 2,
    title: '两数相加',
    slug: 'add-two-numbers',
    difficulty: 'Medium',
    tags: ['链表', '数学'],
    description: '给你两个非空的链表，表示两个非负整数。它们每位数字都是按照逆序的方式存储，每个节点只能存储一位数字。请你将两个数相加，并以链表形式返回。',
    approach: '同位相加并维护进位，按位生成新节点；处理两链表长度不一致以及末尾进位。',
    code: `function addTwoNumbers(l1: any, l2: any): any {
  const dummy: any = { next: null }
  let cur = dummy, carry = 0
  while (l1 || l2 || carry) {
    const s = (l1?.val ?? 0) + (l2?.val ?? 0) + carry
    carry = Math.floor(s / 10)
    cur.next = { val: s % 10, next: null }
    cur = cur.next
    l1 = l1?.next; l2 = l2?.next
  }
  return dummy.next
}`,
    timeComplexity: 'O(max(m,n))',
    spaceComplexity: 'O(1)'
  },
  {
    id: 19,
    title: '删除链表的倒数第 N 个结点',
    slug: 'remove-nth-node-from-end-of-list',
    difficulty: 'Medium',
    tags: ['链表', '双指针'],
    description: '给你一个链表，删除链表的倒数第 n 个结点，并返回链表的头结点。',
    approach: '哨兵 + 快慢指针：快指针先走 n+1 步，再两指针同步，快指针到尾时慢指针正好在待删节点前。',
    code: `function removeNthFromEnd(head: any, n: number): any {
  const dummy: any = { next: head }
  let fast: any = dummy, slow: any = dummy
  for (let i = 0; i <= n; i++) fast = fast.next
  while (fast) { fast = fast.next; slow = slow.next }
  slow.next = slow.next.next
  return dummy.next
}`,
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)'
  },
  {
    id: 24,
    title: '两两交换链表中的节点',
    slug: 'swap-nodes-in-pairs',
    difficulty: 'Medium',
    tags: ['链表', '递归'],
    description: '给你一个链表，两两交换其中相邻的节点，并返回交换后链表的头节点。',
    approach: '哨兵节点 + 三指针：每轮处理两个节点，调整 prev、a、b 三者的指针。',
    code: `function swapPairs(head: any): any {
  const dummy: any = { next: head }
  let prev = dummy
  while (prev.next && prev.next.next) {
    const a = prev.next, b = a.next
    a.next = b.next; b.next = a; prev.next = b
    prev = a
  }
  return dummy.next
}`,
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)'
  },
  { id: 25, title: 'K 个一组翻转链表', slug: 'reverse-nodes-in-k-group', difficulty: 'Hard', tags: ['链表'], description: '给你链表的头节点 head ，每 k 个节点一组进行翻转，请你返回修改后的链表。', approach: '逐段定位长度为 k 的子段，先反转子段内部，再把段头与前驱相接、段尾与下一段相连。', code: '', timeComplexity: 'O(n)', spaceComplexity: 'O(1)' },
  { id: 138, title: '随机链表的复制', slug: 'copy-list-with-random-pointer', difficulty: 'Medium', tags: ['链表', '哈希'], description: '给你一个长度为 n 的链表，每个节点除了 next 指针外，还含有一个 random 指针，请深拷贝该链表。', approach: '哈希表存原节点→克隆节点的映射，第一次遍历建节点，第二次遍历连接 next 与 random。', code: '' },
  { id: 148, title: '排序链表', slug: 'sort-list', difficulty: 'Medium', tags: ['链表', '归并排序'], description: '给你链表的头结点 head，请将其按升序排列并返回排序后的链表。要求 O(n log n) 时间。', approach: '自顶向下归并排序：快慢指针找中点切两半，递归排序后合并。', code: '' },
  { id: 23, title: '合并 K 个升序链表', slug: 'merge-k-sorted-lists', difficulty: 'Hard', tags: ['链表', '堆', '分治'], description: '给你一个链表数组，每个链表都已经按升序排列。请你将所有链表合并到一个升序链表中。', approach: '小顶堆装 k 个链表头，每次弹出最小者并把其 next 加入；或两两归并合并。', code: '' },
  { id: 146, title: 'LRU 缓存', slug: 'lru-cache', difficulty: 'Medium', tags: ['哈希', '双向链表', '设计'], description: '请你设计并实现一个满足 LRU (最近最少使用) 缓存约束的数据结构。', approach: '哈希表 + 双向链表：哈希提供 O(1) 查找，双向链表维护使用顺序，新增/访问移到头部，淘汰尾部。', code: '' },

  // ========== 二叉树 ==========
  { id: 94, title: '二叉树的中序遍历', slug: 'binary-tree-inorder-traversal', difficulty: 'Easy', tags: ['二叉树', '栈'], description: '给定一个二叉树的根节点 root，返回它的中序遍历。', approach: '递归或显式栈：左子树→根→右子树。', code: '' },
  { id: 104, title: '二叉树的最大深度', slug: 'maximum-depth-of-binary-tree', difficulty: 'Easy', tags: ['二叉树', 'DFS'], description: '给定一个二叉树，找出其最大深度。', approach: 'DFS：max(左, 右) + 1。', code: '' },
  { id: 226, title: '翻转二叉树', slug: 'invert-binary-tree', difficulty: 'Easy', tags: ['二叉树'], description: '翻转一棵二叉树。', approach: '递归交换左右子树。', code: '' },
  { id: 101, title: '对称二叉树', slug: 'symmetric-tree', difficulty: 'Easy', tags: ['二叉树'], description: '给定一个二叉树，检查它是否是镜像对称的。', approach: '同步递归比较 left.left 与 right.right、left.right 与 right.left。', code: '' },
  { id: 543, title: '二叉树的直径', slug: 'diameter-of-binary-tree', difficulty: 'Easy', tags: ['二叉树', 'DFS'], description: '给定一棵二叉树，你需要计算它的直径长度。', approach: 'DFS 返回当前子树高度，过程中用 left+right 更新答案。', code: '' },
  { id: 102, title: '二叉树的层序遍历', slug: 'binary-tree-level-order-traversal', difficulty: 'Medium', tags: ['二叉树', 'BFS'], description: '给你二叉树的根节点 root，返回其节点值的层序遍历。', approach: 'BFS 队列，按层取出当前层全部节点。', code: '' },
  { id: 108, title: '将有序数组转换为二叉搜索树', slug: 'convert-sorted-array-to-binary-search-tree', difficulty: 'Easy', tags: ['二叉搜索树', '分治'], description: '给你一个整数数组 nums，请你将其转换为一棵高度平衡 BST。', approach: '取中点为根，递归构建左右子树。', code: '' },
  { id: 98, title: '验证二叉搜索树', slug: 'validate-binary-search-tree', difficulty: 'Medium', tags: ['二叉搜索树', 'DFS'], description: '给你一个二叉树的根节点 root，判断其是否是一个有效的 BST。', approach: '递归带上下界 (lo, hi)；或中序遍历严格递增。', code: '' },
  { id: 230, title: '二叉搜索树中第 K 小的元素', slug: 'kth-smallest-element-in-a-bst', difficulty: 'Medium', tags: ['二叉搜索树'], description: '给定一个 BST 的根节点 root，请你查找其中第 k 个最小的元素。', approach: '中序遍历计数到 k 即停。', code: '' },
  { id: 199, title: '二叉树的右视图', slug: 'binary-tree-right-side-view', difficulty: 'Medium', tags: ['二叉树', 'BFS'], description: '给定一个二叉树的根节点 root，想象自己站在它的右侧，按从顶部到底部的顺序，返回从右侧所能看到的节点值。', approach: 'BFS 每层取最后一个节点。', code: '' },
  { id: 114, title: '二叉树展开为链表', slug: 'flatten-binary-tree-to-linked-list', difficulty: 'Medium', tags: ['二叉树'], description: '给你二叉树的根结点 root，请你将它展开为一个单链表（按先序）。', approach: '把左子树插到根与右子树之间；逐节点处理。', code: '' },
  { id: 105, title: '从前序与中序遍历序列构造二叉树', slug: 'construct-binary-tree-from-preorder-and-inorder-traversal', difficulty: 'Medium', tags: ['二叉树', '递归'], description: '根据前序和中序遍历构造二叉树。', approach: '前序首元素是根，中序中定位根位置切分左右子树并递归。', code: '' },
  { id: 437, title: '路径总和 III', slug: 'path-sum-iii', difficulty: 'Medium', tags: ['二叉树', '前缀和'], description: '给定一个二叉树的根节点 root，返回路径和等于 targetSum 的路径数目（不要求经过根或叶子）。', approach: 'DFS + 前缀和哈希：当前路径上累计前缀和，查找 sum-target 个数。', code: '' },
  { id: 236, title: '二叉树的最近公共祖先', slug: 'lowest-common-ancestor-of-a-binary-tree', difficulty: 'Medium', tags: ['二叉树'], description: '给定一棵二叉树，找到该树中两个指定节点的最近公共祖先。', approach: '递归：若当前为 p 或 q 直接返回；左右子树都非空则当前节点是 LCA。', code: '' },
  { id: 124, title: '二叉树中的最大路径和', slug: 'binary-tree-maximum-path-sum', difficulty: 'Hard', tags: ['二叉树', 'DFS'], description: '给你一个二叉树的根节点 root，返回其最大路径和。路径可以从任意节点出发。', approach: 'DFS 返回包含当前节点向下的最大单边和（负则截断为 0），过程中更新跨根答案。', code: '' },

  // ========== 图论 ==========
  { id: 200, title: '岛屿数量', slug: 'number-of-islands', difficulty: 'Medium', tags: ['DFS', 'BFS', '并查集'], description: '给你一个由 1（陆地）和 0（水）组成的二维网格，请你计算网格中岛屿的数量。', approach: '遍历网格，遇到 1 则 DFS/BFS 把整片连通陆地变成 0，并计数加一。', code: '' },
  { id: 994, title: '腐烂的橘子', slug: 'rotting-oranges', difficulty: 'Medium', tags: ['BFS'], description: '在给定的 m x n 网格中，每分钟腐烂橘子会感染相邻新鲜橘子。返回直到没有新鲜橘子为止所必须经过的最小分钟数。', approach: '多源 BFS：所有腐烂橘子同时入队，按层扩散，记录最大层数即时间。', code: '' },
  { id: 207, title: '课程表', slug: 'course-schedule', difficulty: 'Medium', tags: ['图', '拓扑排序'], description: '给定课程的先修关系，判断是否能完成所有课程的学习。', approach: '建图后做 Kahn 拓扑排序：入度为 0 的节点入队，逐步消减，最终能输出全部节点则可行。', code: '' },
  { id: 208, title: '实现 Trie (前缀树)', slug: 'implement-trie-prefix-tree', difficulty: 'Medium', tags: ['Trie', '设计'], description: '请你实现 Trie 类。', approach: '每个节点维护 26 个子指针 + 终止标记；insert/search/startsWith 都按字符走 trie。', code: '' },

  // ========== 回溯 ==========
  { id: 46, title: '全排列', slug: 'permutations', difficulty: 'Medium', tags: ['回溯'], description: '给定一个不含重复数字的数组 nums，返回其所有可能的全排列。', approach: '回溯 + used 数组：每次选择一个未使用的数加入路径，递归后回退。', code: '' },
  { id: 78, title: '子集', slug: 'subsets', difficulty: 'Medium', tags: ['回溯', '位运算'], description: '给你一个整数数组 nums，返回该数组所有可能的子集。', approach: '回溯：对每个位置选择"取或不取"；或用位掩码枚举 2^n 种。', code: '' },
  { id: 17, title: '电话号码的字母组合', slug: 'letter-combinations-of-a-phone-number', difficulty: 'Medium', tags: ['回溯', '哈希'], description: '给定一个仅包含数字 2-9 的字符串，返回所有它能表示的字母组合。', approach: '回溯：对当前数字遍历对应字母，递归处理下一位。', code: '' },
  { id: 39, title: '组合总和', slug: 'combination-sum', difficulty: 'Medium', tags: ['回溯'], description: '给你一个无重复元素的整数数组 candidates 和一个目标整数 target，找出 candidates 中所有可以使数字和为 target 的组合。元素可以无限制重复使用。', approach: '回溯 + 起点 start 控制不回头；同一元素可重复使用所以下一层仍传 i。', code: '' },
  { id: 22, title: '括号生成', slug: 'generate-parentheses', difficulty: 'Medium', tags: ['回溯', '字符串'], description: '数字 n 代表生成括号的对数，请你设计一个函数，用于能够生成所有可能的并且有效的括号组合。', approach: '回溯：当左括号数 < n 可加左括号；当右括号数 < 左括号数可加右括号。', code: '' },
  { id: 79, title: '单词搜索', slug: 'word-search', difficulty: 'Medium', tags: ['回溯', 'DFS'], description: '给定一个 m x n 二维字符网格 board 和一个字符串单词 word，如果 word 存在于网格中，返回 true。', approach: '回溯：在每个起点 DFS 上下左右；用临时占位防止重复访问。', code: '' },
  { id: 131, title: '分割回文串', slug: 'palindrome-partitioning', difficulty: 'Medium', tags: ['回溯', '动态规划'], description: '给你一个字符串 s，请你将 s 分割成一些子串，使每个子串都是回文串。', approach: '回溯：枚举切点，预处理 dp[i][j] 是否回文以剪枝。', code: '' },
  { id: 51, title: 'N 皇后', slug: 'n-queens', difficulty: 'Hard', tags: ['回溯'], description: '研究 N 皇后问题：在 n×n 棋盘上放置 n 个皇后，使彼此不能相互攻击。', approach: '逐行回溯，使用三个 set 记录列、主对角线、副对角线被占用情况。', code: '' },

  // ========== 二分查找 ==========
  { id: 35, title: '搜索插入位置', slug: 'search-insert-position', difficulty: 'Easy', tags: ['二分'], description: '给定一个排序数组和一个目标值，在数组中找到目标值并返回其索引。如果目标值不存在，返回它将会被按顺序插入的位置。', approach: '标准下界二分。', code: '' },
  { id: 74, title: '搜索二维矩阵', slug: 'search-a-2d-matrix', difficulty: 'Medium', tags: ['二分'], description: '给你一个满足下述两条属性的 m x n 矩阵：每行升序、每行的第一个整数大于前一行的最后一个整数，判断 target 是否存在。', approach: '把矩阵视为长度 mn 的有序数组做二分；下标转换 (idx/n, idx%n)。', code: '' },
  { id: 34, title: '在排序数组中查找元素的第一个和最后一个位置', slug: 'find-first-and-last-position-of-element-in-sorted-array', difficulty: 'Medium', tags: ['二分'], description: '给你一个按非递减顺序排列的整数数组 nums，和一个目标值 target，请你找出给定目标值在数组中的开始位置和结束位置。', approach: '两次二分：分别求左边界（lower_bound target）和右边界（lower_bound target+1 - 1）。', code: '' },
  { id: 33, title: '搜索旋转排序数组', slug: 'search-in-rotated-sorted-array', difficulty: 'Medium', tags: ['二分'], description: '在旋转过的升序数组中查找 target，要求 O(log n)。', approach: '二分：判断左半段或右半段哪段有序，再判断 target 是否落在有序段中。', code: '' },
  { id: 153, title: '寻找旋转排序数组中的最小值', slug: 'find-minimum-in-rotated-sorted-array', difficulty: 'Medium', tags: ['二分'], description: '已知一个长度为 n 的数组，预先按照升序排列后又被旋转，找出其中的最小元素。', approach: '二分：与右端比较，若 mid > right 则最小值在右半，否则在左半（含 mid）。', code: '' },
  { id: 4, title: '寻找两个正序数组的中位数', slug: 'median-of-two-sorted-arrays', difficulty: 'Hard', tags: ['二分', '分治'], description: '给定两个大小分别为 m 和 n 的正序数组 nums1 和 nums2，请你找出并返回这两个正序数组的中位数。要求 O(log(m+n))。', approach: '在较短数组上二分切分，使两半元素数相等且 left1<=right2 && left2<=right1。', code: '' },

  // ========== 栈 ==========
  { id: 20, title: '有效的括号', slug: 'valid-parentheses', difficulty: 'Easy', tags: ['栈'], description: '给定一个只包括 \'()[]{}\' 的字符串，判断字符串是否有效。', approach: '栈：左括号入栈，右括号比对栈顶；最后栈空则有效。', code: '' },
  { id: 155, title: '最小栈', slug: 'min-stack', difficulty: 'Medium', tags: ['栈', '设计'], description: '设计一个支持 push、pop、top、并能在常数时间内检索到最小元素的栈。', approach: '辅助栈同步存放当前最小值，或主栈存差值并用 min 变量维护当前最小。', code: '' },
  { id: 394, title: '字符串解码', slug: 'decode-string', difficulty: 'Medium', tags: ['栈', '字符串'], description: '给定一个经过编码的字符串，返回它解码后的字符串。编码规则为：k[encoded_string]。', approach: '双栈：一个存倍数，一个存上一层字符串；遇 [ 入栈，遇 ] 出栈拼接。', code: '' },
  { id: 739, title: '每日温度', slug: 'daily-temperatures', difficulty: 'Medium', tags: ['单调栈'], description: '给定一个整数数组 temperatures，表示每天的温度，返回一个数组 answer，其中 answer[i] 是指对于第 i 天，下一个更高温度出现在几天后。', approach: '单调递减栈存下标；当前温度大于栈顶温度时出栈并写入差值。', code: '' },
  { id: 84, title: '柱状图中最大的矩形', slug: 'largest-rectangle-in-histogram', difficulty: 'Hard', tags: ['单调栈'], description: '给定 n 个非负整数，用来表示柱状图中各个柱子的高度。求在该柱状图中，能够勾勒出来的矩形的最大面积。', approach: '单调递增栈：对每个柱子找其左右第一个更矮位置，矩形宽度为 right-left-1。', code: '' },

  // ========== 堆 ==========
  { id: 215, title: '数组中的第 K 个最大元素', slug: 'kth-largest-element-in-an-array', difficulty: 'Medium', tags: ['堆', '快速选择'], description: '给定整数数组 nums 和整数 k，请返回数组中第 k 个最大的元素。', approach: '小顶堆维护前 k 大；或用快速选择 O(n) 平均。', code: '' },
  { id: 347, title: '前 K 个高频元素', slug: 'top-k-frequent-elements', difficulty: 'Medium', tags: ['堆', '哈希', '桶排序'], description: '给你一个整数数组 nums 和一个整数 k，请你返回其中出现频率前 k 高的元素。', approach: '哈希计数 + 大小为 k 的小顶堆；或桶排序按频次分桶。', code: '' },
  { id: 295, title: '数据流的中位数', slug: 'find-median-from-data-stream', difficulty: 'Hard', tags: ['堆', '设计'], description: '中位数是有序整数列表中的中间值。如果列表的大小是偶数，中位数是中间两个数的平均值。设计一个支持以下两种操作的数据结构。', approach: '大顶堆存较小一半 + 小顶堆存较大一半，保持两堆大小平衡。', code: '' },

  // ========== 贪心 ==========
  { id: 121, title: '买卖股票的最佳时机', slug: 'best-time-to-buy-and-sell-stock', difficulty: 'Easy', tags: ['贪心', '动态规划'], description: '给定一个数组 prices，第 i 个元素 prices[i] 表示一支股票第 i 天的价格。只能进行一次买卖，求最大利润。', approach: '一次遍历，维护至今最低价，更新当前价 - 最低价的最大值。', code: '' },
  { id: 55, title: '跳跃游戏', slug: 'jump-game', difficulty: 'Medium', tags: ['贪心'], description: '给定一个非负整数数组 nums，你最初位于数组的第一个下标。数组中的每个元素代表你在该位置可以跳跃的最大长度。判断你是否能够到达最后一个下标。', approach: '贪心维护可达最远下标 farthest；若当前 i > farthest 失败。', code: '' },
  { id: 45, title: '跳跃游戏 II', slug: 'jump-game-ii', difficulty: 'Medium', tags: ['贪心'], description: '给定一个长度为 n 的整数数组 nums，初始位置为 nums[0]。每个元素 nums[i] 表示从下标 i 向前跳转的最大长度。返回到达 nums[n-1] 的最小跳跃次数。', approach: '维护当前能到达的最远点 end 和潜在最远点 farthest；i 到 end 时步数 +1 并更新 end。', code: '' },
  { id: 763, title: '划分字母区间', slug: 'partition-labels', difficulty: 'Medium', tags: ['贪心', '哈希'], description: '给你一个字符串 s。我们要把这个字符串划分为尽可能多的片段，同一字母最多出现在一个片段中。', approach: '记录每个字母最后出现位置，遍历 s 维护当前片段右端 = max(右端, last[c])，i 到右端则切割。', code: '' },

  // ========== 动态规划 ==========
  { id: 70, title: '爬楼梯', slug: 'climbing-stairs', difficulty: 'Easy', tags: ['动态规划'], description: '假设你正在爬楼梯。需要 n 阶你才能到达楼顶。每次你可以爬 1 或 2 个台阶。', approach: 'f(n) = f(n-1) + f(n-2)，等价 Fibonacci。', code: '' },
  { id: 118, title: '杨辉三角', slug: 'pascals-triangle', difficulty: 'Easy', tags: ['动态规划'], description: '给定一个非负整数 numRows，生成「杨辉三角」的前 numRows 行。', approach: '逐行构造，第 i 行第 j 列 = 上一行 j-1 + 上一行 j。', code: '' },
  { id: 198, title: '打家劫舍', slug: 'house-robber', difficulty: 'Medium', tags: ['动态规划'], description: '你是一个专业的小偷，相邻的房屋装有相互连通的防盗系统，因此不能在相邻房屋盗窃。', approach: 'dp[i] = max(dp[i-1], dp[i-2] + nums[i])，可滚动两个变量。', code: '' },
  { id: 279, title: '完全平方数', slug: 'perfect-squares', difficulty: 'Medium', tags: ['动态规划', 'BFS'], description: '给你一个整数 n，返回和为 n 的完全平方数的最少数量。', approach: 'dp[i] = min(dp[i - j*j] + 1)，j*j ≤ i。', code: '' },
  { id: 322, title: '零钱兑换', slug: 'coin-change', difficulty: 'Medium', tags: ['动态规划', '完全背包'], description: '给你一个整数数组 coins，表示不同面额的硬币；以及一个整数 amount，表示总金额。计算并返回可以凑成总金额所需的最少的硬币个数。', approach: '完全背包 dp[amount]：dp[i] = min(dp[i - c] + 1) for c in coins。', code: '' },
  { id: 139, title: '单词拆分', slug: 'word-break', difficulty: 'Medium', tags: ['动态规划'], description: '给你一个字符串 s 和一个字符串列表 wordDict，请你判断 s 是否可以由 wordDict 中的单词拼接出来。', approach: 'dp[i] 表示 s[0..i) 可被拆分；dp[i] = ∃ j 使得 dp[j] && s[j..i) ∈ dict。', code: '' },
  { id: 300, title: '最长递增子序列', slug: 'longest-increasing-subsequence', difficulty: 'Medium', tags: ['动态规划', '二分'], description: '给你一个整数数组 nums，找到其中最长严格递增子序列的长度。', approach: 'O(n²) DP；或用 tails 数组配合二分得到 O(n log n)。', code: '' },
  { id: 152, title: '乘积最大子数组', slug: 'maximum-product-subarray', difficulty: 'Medium', tags: ['动态规划'], description: '给你一个整数数组 nums，请你找出数组中乘积最大的非空连续子数组。', approach: '同时维护以 i 结尾的最大、最小乘积，遇负数交换。', code: '' },
  { id: 416, title: '分割等和子集', slug: 'partition-equal-subset-sum', difficulty: 'Medium', tags: ['动态规划', '0-1 背包'], description: '给你一个只包含正整数的非空数组 nums。请你判断是否可以将这个数组分割成两个子集，使得两个子集的元素和相等。', approach: '化为 0-1 背包：能否选若干数恰好和为 sum/2。', code: '' },
  { id: 32, title: '最长有效括号', slug: 'longest-valid-parentheses', difficulty: 'Hard', tags: ['动态规划', '栈'], description: '给你一个只包含 \'(\' 和 \')\' 的字符串，找出最长有效（格式正确且连续）括号子串的长度。', approach: '栈解法：栈底放最后一个未匹配 ) 的位置，遇 ( 入栈下标，遇 ) 出栈并用当前下标 - 栈顶 更新答案。', code: '' },

  // ========== 多维 DP ==========
  { id: 62, title: '不同路径', slug: 'unique-paths', difficulty: 'Medium', tags: ['动态规划'], description: '一个机器人位于 m × n 网格的左上角，每次只能向下或向右移动一步。问到达右下角共有多少条不同的路径？', approach: 'dp[i][j] = dp[i-1][j] + dp[i][j-1]，可压成一维。', code: '' },
  { id: 64, title: '最小路径和', slug: 'minimum-path-sum', difficulty: 'Medium', tags: ['动态规划'], description: '给定一个非负整数的 m × n 网格 grid，请找出一条从左上角到右下角的路径，使得路径上的数字总和为最小。', approach: 'dp[i][j] = min(dp[i-1][j], dp[i][j-1]) + grid[i][j]。', code: '' },
  { id: 5, title: '最长回文子串', slug: 'longest-palindromic-substring', difficulty: 'Medium', tags: ['动态规划', '中心扩展'], description: '给你一个字符串 s，找到 s 中最长的回文子串。', approach: '中心扩展：枚举每个中心（奇/偶各一次），向两侧扩展。', code: '' },
  { id: 1143, title: '最长公共子序列', slug: 'longest-common-subsequence', difficulty: 'Medium', tags: ['动态规划'], description: '给定两个字符串 text1 和 text2，返回它们的最长公共子序列的长度。', approach: 'dp[i][j]：相等则 dp[i-1][j-1]+1，否则 max(dp[i-1][j], dp[i][j-1])。', code: '' },
  { id: 72, title: '编辑距离', slug: 'edit-distance', difficulty: 'Medium', tags: ['动态规划'], description: '给你两个单词 word1 和 word2，请返回将 word1 转换成 word2 所使用的最少操作数（插入/删除/替换）。', approach: 'dp[i][j]：相等则 dp[i-1][j-1]，否则 min(替换/插入/删除) + 1。', code: '' },

  // ========== 技巧 ==========
  { id: 136, title: '只出现一次的数字', slug: 'single-number', difficulty: 'Easy', tags: ['位运算'], description: '给你一个非空整数数组 nums，除了某个元素只出现一次以外，其余每个元素均出现两次。找出那个只出现一次的元素。', approach: '全部异或，相同元素抵消，剩下的就是答案。', code: '' },
  { id: 169, title: '多数元素', slug: 'majority-element', difficulty: 'Easy', tags: ['Boyer-Moore', '哈希'], description: '给定一个大小为 n 的数组 nums，返回其中的多数元素（出现次数 > ⌊n/2⌋）。', approach: 'Boyer-Moore 投票：候选者 + 计数，遇相同 +1 否则 -1，归零换候选。', code: '' },
  { id: 75, title: '颜色分类', slug: 'sort-colors', difficulty: 'Medium', tags: ['双指针'], description: '给定一个包含红色、白色和蓝色、共 n 个元素的数组 nums，原地对它们进行排序。使用整数 0、1 和 2 分别表示红色、白色和蓝色。', approach: '荷兰国旗：三指针 lo/mid/hi，遇 0 与 lo 交换并双移，遇 2 与 hi 交换 hi 左移，遇 1 mid 右移。', code: '' },
  { id: 31, title: '下一个排列', slug: 'next-permutation', difficulty: 'Medium', tags: ['数组'], description: '实现获取下一个排列的函数，算法需要将给定数字序列重新排列成字典序中下一个更大的排列。', approach: '从右找第一个 nums[i] < nums[i+1]；再从右找第一个 > nums[i] 与之交换；最后反转 i+1 到末尾。', code: '' },
  { id: 287, title: '寻找重复数', slug: 'find-the-duplicate-number', difficulty: 'Medium', tags: ['双指针', '环检测'], description: '给定一个包含 n+1 个整数的数组 nums，其数字都在 [1, n] 范围内，找出这个重复的数。要求不能修改数组且 O(1) 额外空间。', approach: '把数组视为隐式链表 (i → nums[i])，用 Floyd 算法检测环入口即重复数。', code: '' }
]

/** 所有标签的去重列表（按字母排序） */
export const allTags: string[] = Array.from(
  new Set(problems.flatMap((p) => p.tags))
).sort()
