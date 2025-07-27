
# LLM 学习：Transformer 详解

Transformer 架构是现代 LLM 的基石。它彻底改变了序列建模的方式，尤其是通过引入了**自注意力机制**（Self-Attention）。

## Transformer 架构概述

Transformer 摒弃了传统的循环神经网络（RNN）和卷积神经网络（CNN）结构，完全依赖于注意力机制来捕捉输入序列中的依赖关系。

### 编码器-解码器结构
一个标准的 Transformer 模型由一个编码器（Encoder）和一个解码器（Decoder）组成。

*   **编码器**：负责处理输入序列，并生成一系列上下文相关的表示。
*   **解码器**：负责生成输出序列，通常是在编码器输出的帮助下。

## 自注意力机制

自注意力机制允许模型在处理序列中的某个词时，同时关注到序列中的所有其他词，并为它们分配不同的权重。

$$ \text{Attention}(Q, K, V) = \text{softmax}\left(\frac{QK^T}{\sqrt{d_k}}\right)V $$

其中：
*   $Q$ (Query)：查询向量。
*   $K$ (Key)：键向量。
*   $V$ (Value)：值向量。
*   $\sqrt{d_k}$：缩放因子，用于防止点积过大。

## 多头注意力

Transformer 使用“多头”注意力（Multi-Head Attention），即并行地运行多个自注意力机制，并将它们的输出拼接起来，从而捕获不同层面的注意力信息。

### 残差连接与层归一化
为了防止梯度消失和加速训练，Transformer 在每个子层后都使用了残差连接（Residual Connection）和层归一化（Layer Normalization）。

Transformer 的强大之处在于其并行化能力和捕获长距离依赖的优势，这使得它在各种 NLP 任务中取得了突破性进展。

---
本文由 SingularGuyLeBorn 编写。
        