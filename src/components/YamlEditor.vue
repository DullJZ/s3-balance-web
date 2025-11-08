<template>
  <div ref="editorRef" class="yaml-editor-wrapper"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { EditorView, basicSetup } from 'codemirror'
import { yaml } from '@codemirror/lang-yaml'
import { oneDark } from '@codemirror/theme-one-dark'
import { EditorState } from '@codemirror/state'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const editorRef = ref<HTMLElement>()
let editorView: EditorView | null = null

// 初始化编辑器
onMounted(() => {
  if (!editorRef.value) return

  // 创建编辑器状态
  const startState = EditorState.create({
    doc: props.modelValue,
    extensions: [
      basicSetup,
      yaml(),
      oneDark,
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          const newValue = update.state.doc.toString()
          emit('update:modelValue', newValue)
        }
      }),
      EditorView.theme({
        '&': {
          height: '600px',
          fontSize: '14px',
        },
        '.cm-scroller': {
          overflow: 'auto',
          fontFamily: 'Monaco, Menlo, Ubuntu Mono, Consolas, source-code-pro, monospace',
        },
      }),
    ],
  })

  // 创建编辑器视图
  editorView = new EditorView({
    state: startState,
    parent: editorRef.value,
  })
})

// 监听外部值变化
watch(
  () => props.modelValue,
  (newValue) => {
    if (editorView && editorView.state.doc.toString() !== newValue) {
      editorView.dispatch({
        changes: {
          from: 0,
          to: editorView.state.doc.length,
          insert: newValue,
        },
      })
    }
  }
)

// 清理
onUnmounted(() => {
  if (editorView) {
    editorView.destroy()
    editorView = null
  }
})

// 暴露方法供父组件调用
defineExpose({
  focus: () => editorView?.focus(),
  getValue: () => editorView?.state.doc.toString() || '',
})
</script>

<style scoped>
.yaml-editor-wrapper {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
}

.yaml-editor-wrapper :deep(.cm-editor) {
  height: 100%;
}

.yaml-editor-wrapper :deep(.cm-gutters) {
  background-color: #282c34;
  border-right: 1px solid #21252b;
}

.yaml-editor-wrapper :deep(.cm-activeLineGutter) {
  background-color: #2c313c;
}
</style>
