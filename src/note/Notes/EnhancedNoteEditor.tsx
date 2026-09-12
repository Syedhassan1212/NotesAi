import React, { useCallback, useState, useEffect } from 'react'
import { useTheme } from '../../contexts/ThemeContext'

import RichTextEditor, { BaseKit } from 'reactjs-tiptap-editor'
import {
  BubbleMenuTwitter,
  BubbleMenuKatex,
  BubbleMenuExcalidraw,
  BubbleMenuMermaid,
  BubbleMenuDrawer
} from 'reactjs-tiptap-editor/bubble-extra'

import { Attachment } from 'reactjs-tiptap-editor/attachment'
import { Blockquote } from 'reactjs-tiptap-editor/blockquote'
import { Bold } from 'reactjs-tiptap-editor/bold'
import { BulletList } from 'reactjs-tiptap-editor/bulletlist'
import { Clear } from 'reactjs-tiptap-editor/clear'
import { Code } from 'reactjs-tiptap-editor/code'
import { CodeBlock } from 'reactjs-tiptap-editor/codeblock'
import { Color } from 'reactjs-tiptap-editor/color'
import { ColumnActionButton } from 'reactjs-tiptap-editor/multicolumn'
import { Emoji } from 'reactjs-tiptap-editor/emoji'
import { ExportPdf } from 'reactjs-tiptap-editor/exportpdf'
import { ExportWord } from 'reactjs-tiptap-editor/exportword'
import { FontFamily } from 'reactjs-tiptap-editor/fontfamily'
import { FontSize } from 'reactjs-tiptap-editor/fontsize'
import { FormatPainter } from 'reactjs-tiptap-editor/formatpainter'
import { Heading } from 'reactjs-tiptap-editor/heading'
import { Highlight } from 'reactjs-tiptap-editor/highlight'
import { History } from 'reactjs-tiptap-editor/history'
import { HorizontalRule } from 'reactjs-tiptap-editor/horizontalrule'
import { Iframe } from 'reactjs-tiptap-editor/iframe'
import { Image } from 'reactjs-tiptap-editor/image'
import { ImageGif } from 'reactjs-tiptap-editor/imagegif'
import { ImportWord } from 'reactjs-tiptap-editor/importword'
import { Indent } from 'reactjs-tiptap-editor/indent'
import { Italic } from 'reactjs-tiptap-editor/italic'
import { LineHeight } from 'reactjs-tiptap-editor/lineheight'
import { Link } from 'reactjs-tiptap-editor/link'
import { Mention } from 'reactjs-tiptap-editor/mention'
import { MoreMark } from 'reactjs-tiptap-editor/moremark'
import { OrderedList } from 'reactjs-tiptap-editor/orderedlist'
import { SearchAndReplace } from 'reactjs-tiptap-editor/searchandreplace'
import { SlashCommand } from 'reactjs-tiptap-editor/slashcommand'
import { Strike } from 'reactjs-tiptap-editor/strike'
import { Table } from 'reactjs-tiptap-editor/table'
import { TableOfContents } from 'reactjs-tiptap-editor/tableofcontent'
import { TaskList } from 'reactjs-tiptap-editor/tasklist'
import { TextAlign } from 'reactjs-tiptap-editor/textalign'
import { TextUnderline } from 'reactjs-tiptap-editor/textunderline'
import { Video } from 'reactjs-tiptap-editor/video'
import { TextDirection } from 'reactjs-tiptap-editor/textdirection'
import { Katex } from 'reactjs-tiptap-editor/katex'
import { Drawer } from 'reactjs-tiptap-editor/drawer'
import { Excalidraw } from 'reactjs-tiptap-editor/excalidraw'
import { Twitter } from 'reactjs-tiptap-editor/twitter'
import { Mermaid } from 'reactjs-tiptap-editor/mermaid'
import { exportNoteToPdf } from '../../utils/exportToPdf'

import 'reactjs-tiptap-editor/style.css'
import 'prism-code-editor-lightweight/layout.css'
import "prism-code-editor-lightweight/themes/github-dark.css"
import 'katex/dist/katex.min.css'
import 'easydrawer/styles.css'
import 'react-image-crop/dist/ReactCrop.css'
import "@excalidraw/excalidraw/index.css"
import type { Note } from './NotesPage'

type Props = {
  note: Note
  onChange: (note: Note) => void
  onSave: () => void
  onBack: () => void
}

function convertBase64ToBlob(base64: string) {
  const arr = base64.split(',')
  const mime = arr[0].match(/:(.*?);/)![1]
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new Blob([u8arr], { type: mime })
}

const extensions = [
  BaseKit.configure({
    placeholder: {
      showOnlyCurrent: true,
    },
    characterCount: {
      limit: 150_000,
    },
  }),
  History,
  SearchAndReplace,
  TableOfContents,
  FormatPainter.configure({ spacer: true }),
  Clear,
  FontFamily,
  Heading.configure({ spacer: true }),
  FontSize,
  Bold,
  Italic,
  TextUnderline,
  Strike,
  MoreMark,
  Emoji,
  Color.configure({ spacer: true }),
  Highlight,
  BulletList,
  OrderedList,
  TextAlign.configure({ types: ['heading', 'paragraph'], spacer: true }),
  Indent,
  LineHeight,
  TaskList.configure({
    spacer: true,
    taskItem: {
      nested: true,
    },
  }),
  Link,
  Image.configure({
    upload: (files: File) => {
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = () => {
          resolve(reader.result as string)
        }
        reader.onerror = () => resolve('')
        reader.readAsDataURL(files)
      })
    },
    HTMLAttributes: {
      class: 'enhanced-editor-image',
    },
  }),
  Video.configure({
    upload: (files: File) => {
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = () => {
          resolve(reader.result as string)
        }
        reader.readAsDataURL(files)
      })
    },
  }),
  ImageGif.configure({
    GIPHY_API_KEY: (import.meta as any).env?.VITE_GIPHY_API_KEY as string,
  }),
  Blockquote,
  SlashCommand,
  HorizontalRule,
  Code.configure({
    toolbar: false,
  }),
  CodeBlock,
  ColumnActionButton,
  Table,
  Iframe,
  ExportPdf.configure({ spacer: true }),
  ImportWord.configure({
    upload: (files: File[]) => {
      return Promise.all(files.map(file => {
        return new Promise((resolve) => {
          const reader = new FileReader()
          reader.onload = () => {
            resolve({
              src: reader.result as string,
              alt: file.name,
            })
          }
          reader.readAsDataURL(file)
        })
      }))
    },
  }),
  ExportWord,
  TextDirection,
  Mention,
  Attachment.configure({
    upload: (file: any) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)

      return new Promise((resolve) => {
        setTimeout(() => {
          const blob = convertBase64ToBlob(reader.result as string)
          resolve(URL.createObjectURL(blob))
        }, 300)
      })
    },
  }),
  Katex,
  Excalidraw,
  Mermaid.configure({
    upload: (file: any) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      return new Promise((resolve) => {
        setTimeout(() => {
          const blob = convertBase64ToBlob(reader.result as string)
          resolve(URL.createObjectURL(blob))
        }, 300)
      })
    },
  }),
  Drawer.configure({
    upload: (file: any) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      return new Promise((resolve) => {
        setTimeout(() => {
          const blob = convertBase64ToBlob(reader.result as string)
          resolve(URL.createObjectURL(blob))
        }, 300)
      })
    },
  }),
  Twitter,
]

function debounce(func: any, wait: number) {
  let timeout: NodeJS.Timeout
  return function (...args: any[]) {
    clearTimeout(timeout)
    // @ts-ignore
    timeout = setTimeout(() => func.apply(this, args), wait)
  }
}

export default function EnhancedNoteEditor({ note, onChange, onSave, onBack }: Props) {
  const { resolvedTheme } = useTheme();
  const [content, setContent] = useState(note.content || '')
  const [title, setTitle] = useState(note.title || '')
  const [tags, setTags] = useState<string[]>(note.tags || [])
  const [newTag, setNewTag] = useState('')

  const processContent = (content: string, isInitialLoad = false) => {
    if (!content) return ''
    if (!isInitialLoad && (!content.includes('<img') || content.includes('enhanced-editor-image'))) {
      return content
    }
    let processedContent = content.replace(/<img([^>]*?)>/gi, (match, attrs) => {
      if (!attrs.includes('class=')) {
        return `<img${attrs} class="enhanced-editor-image">`
      }
      return match
    })
    return processedContent
  }

  useEffect(() => {
    const newContent = note.content || ''
    const processedContent = processContent(newContent, true) 
    setContent(processedContent)
    setTitle(note.title || '')
    setTags(note.tags || [])
  }, [note.id, note.title, note.tags, note.content])

  const onValueChange = useCallback(
    debounce((value: any) => {
      setContent(value)
      onChange({
        ...note,
        content: value,
        title,
        tags,
        updatedAt: Date.now()
      })
    }, 100),
    [note, title, tags, onChange]
  )

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value
    setTitle(newTitle)
    onChange({
      ...note,
      title: newTitle,
      content,
      tags,
      updatedAt: Date.now()
    })
  }

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      const newTags = [...tags, newTag.trim()]
      setTags(newTags)
      setNewTag('')
      onChange({
        ...note,
        title,
        content,
        tags: newTags,
        updatedAt: Date.now()
      })
    }
  }

  const removeTag = (tagToRemove: string) => {
    const newTags = tags.filter(tag => tag !== tagToRemove)
    setTags(newTags)
    onChange({
      ...note,
      title,
      content,
      tags: newTags,
      updatedAt: Date.now()
    })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }

  const handleExportPdf = async () => {
    try {
      await exportNoteToPdf(title, content, tags, `${title || 'note'}.pdf`)
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  const handlePrint = () => {
    try {
      const title = note.title || 'Untitled Note'
      // Get the latest content from Quill
      const currentContent = content || note.content
      
      // Create a new window for printing
      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        alert('Please allow popups to print this note.')
        return
      }


      // Create the print content with comprehensive styling
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${title}</title>
          <meta charset="utf-8">
          <style>
            /* Reset and base styles */
            * {
              box-sizing: border-box;
            }
            
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
              font-size: 14px;
            }
            
            /* Typography */
            h1, h2, h3, h4, h5, h6 {
              color: #2c3e50;
              margin-top: 1.5em;
              margin-bottom: 0.5em;
              font-weight: bold;
            }
            h1 { font-size: 2em; border-bottom: 2px solid #3498db; padding-bottom: 0.3em; }
            h2 { font-size: 1.5em; }
            h3 { font-size: 1.3em; }
            h4 { font-size: 1.1em; }
            h5 { font-size: 1em; }
            h6 { font-size: 0.9em; }
            
            p { 
              margin-bottom: 1em; 
              margin-top: 0;
            }
            
            ul, ol { 
              margin-bottom: 1em; 
              padding-left: 2em; 
            }
            
            li {
              margin-bottom: 0.5em;
            }
            
            blockquote {
              border-left: 4px solid #3498db;
              margin: 1em 0;
              padding-left: 1em;
              color: #666;
              font-style: italic;
            }
            
            /* Code styling */
            code {
              background-color: #f4f4f4;
              padding: 2px 4px;
              border-radius: 3px;
              font-family: 'Courier New', 'Monaco', 'Consolas', monospace;
              font-size: 0.9em;
            }
            
            pre {
              background-color: #f4f4f4;
              padding: 1em;
              border-radius: 5px;
              overflow-x: auto;
              font-family: 'Courier New', 'Monaco', 'Consolas', monospace;
              font-size: 0.9em;
              line-height: 1.4;
            }
            
            pre code {
              background: none;
              padding: 0;
            }
            
            /* Image styling */
            img {
              max-width: 100%;
              height: auto;
              display: block;
              margin: 1em auto;
              border-radius: 4px;
              page-break-inside: avoid;
            }
            
            /* PDF page styling - preserve exact appearance */
            .pdf-page {
              margin-bottom: 20px;
              text-align: center;
              border: 1px solid #ddd;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
              page-break-inside: avoid;
            }
            
            .pdf-page img {
              max-width: 100%;
              height: auto;
              display: block;
              margin: 0;
              border-radius: 0;
            }
            
            .pdf-page div {
              background: #f8f9fa;
              padding: 8px;
              font-size: 12px;
              color: #666;
              border-top: 1px solid #ddd;
            }
            
            /* Quill-specific styles */
            .ql-editor {
              font-family: inherit;
              line-height: inherit;
              color: inherit;
            }
            
            .ql-editor p {
              margin-bottom: 1em;
            }
            
            .ql-editor h1, .ql-editor h2, .ql-editor h3, .ql-editor h4, .ql-editor h5, .ql-editor h6 {
              margin-top: 1.5em;
              margin-bottom: 0.5em;
            }
            
            .ql-editor ul, .ql-editor ol {
              margin-bottom: 1em;
              padding-left: 2em;
            }
            
            .ql-editor blockquote {
              border-left: 4px solid #3498db;
              margin: 1em 0;
              padding-left: 1em;
              color: #666;
              font-style: italic;
            }
            
            .ql-editor code {
              background-color: #f4f4f4;
              padding: 2px 4px;
              border-radius: 3px;
              font-family: 'Courier New', 'Monaco', 'Consolas', monospace;
            }
            
            .ql-editor pre {
              background-color: #f4f4f4;
              padding: 1em;
              border-radius: 5px;
              overflow-x: auto;
              font-family: 'Courier New', 'Monaco', 'Consolas', monospace;
            }
            
            /* Text formatting */
            strong, b {
              font-weight: bold;
            }
            
            em, i {
              font-style: italic;
            }
            
            u {
              text-decoration: underline;
            }
            
            s, strike {
              text-decoration: line-through;
            }
            
            /* Lists */
            ul {
              list-style-type: disc;
            }
            
            ol {
              list-style-type: decimal;
            }
            
            /* Links */
            a {
              color: #3498db;
              text-decoration: underline;
            }
            
            /* Tables */
            table {
              border-collapse: collapse;
              width: 100%;
              margin: 1em 0;
            }
            
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            
            th {
              background-color: #f4f4f4;
              font-weight: bold;
            }
            
            /* Print-specific styles */
            @media print {
              body { 
                margin: 0; 
                padding: 15px; 
                font-size: 12px;
              }
              .no-print { display: none; }
              
              /* Preserve images exactly */
              img {
                max-width: 100% !important;
                height: auto !important;
                page-break-inside: avoid !important;
              }
              
              /* Preserve PDF pages exactly */
              .pdf-page {
                page-break-inside: avoid !important;
                margin-bottom: 15px !important;
                box-shadow: none !important;
                border: 1px solid #000 !important;
              }
              
              .pdf-page img {
                max-width: 100% !important;
                height: auto !important;
                margin: 0 !important;
              }
              
              .pdf-page div {
                background: #f0f0f0 !important;
                font-size: 10px !important;
                padding: 4px !important;
              }
              
              h1 { font-size: 1.8em; }
              h2 { font-size: 1.4em; }
              h3 { font-size: 1.2em; }
              
              /* Ensure content doesn't break awkwardly */
              p, div, span {
                orphans: 3;
                widows: 3;
              }
              
              /* Preserve all inline styles in print */
              *[style] {
                /* Allow all inline styles to be preserved */
              }
              
              /* Preserve text alignment in print */
              *[style*="text-align: center"] {
                text-align: center !important;
              }
              
              *[style*="text-align: right"] {
                text-align: right !important;
              }
              
              *[style*="text-align: left"] {
                text-align: left !important;
              }
              
              /* Preserve colors in print (if printer supports color) */
              *[style*="color"] {
                color: inherit !important;
              }
              
              /* Preserve font styles in print */
              *[style*="font-family"] {
                font-family: inherit !important;
              }
              
              *[style*="font-size"] {
                font-size: inherit !important;
              }
              
              *[style*="font-weight"] {
                font-weight: inherit !important;
              }
            }
            
            /* Preserve Quill formatting - but allow colors and styles */
            .ql-editor * {
              /* Don't override colors and backgrounds - preserve them */
            }
            
            /* Preserve text alignment */
            .ql-editor [style*="text-align"] {
              text-align: inherit !important;
            }
            
            /* Preserve colors */
            .ql-editor [style*="color"] {
              color: inherit !important;
            }
            
            /* Preserve background colors */
            .ql-editor [style*="background-color"] {
              background-color: inherit !important;
            }
            
            /* Preserve font families */
            .ql-editor [style*="font-family"] {
              font-family: inherit !important;
            }
            
            /* Preserve font sizes */
            .ql-editor [style*="font-size"] {
              font-size: inherit !important;
            }
            
            /* Ensure proper spacing */
            .ql-editor > *:first-child {
              margin-top: 0;
            }
            
            .ql-editor > *:last-child {
              margin-bottom: 0;
            }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <div class="ql-editor content">
            ${currentContent}
          </div>
        </body>
        </html>
      `

      printWindow.document.write(printContent)
      printWindow.document.close()
      
      // Wait for content to load, then trigger print
      printWindow.onload = () => {
        printWindow.focus()
        printWindow.print()
        printWindow.close()
      }
    } catch (error) {
      console.error('Print failed:', error)
      alert('Failed to print note. Please try again.')
    }
  }

  return (
    <div className="w-full relative pb-32">
      {/* Whisper-thin Top Utility Bar */}
      <div className="sticky top-14 z-30 w-full bg-surface/90 backdrop-blur-md transition-all">
        <div className="w-full max-w-screen-2xl mx-auto px-6 md:px-16 lg:px-24 py-space-sm flex items-center justify-between">
          <div className="flex items-center gap-space-md">
            <button 
              onClick={onBack}
              className="inline-flex items-center gap-space-xs text-on-surface-variant hover:text-on-surface transition-colors group"
            >
              <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
              <span className="font-label-md text-label-md">Notes</span>
            </button>
            <div className="w-1 h-1 rounded-full bg-outline-variant"></div>
            <div className="inline-flex items-center gap-space-xs text-text-tertiary">
              <span className="material-symbols-outlined text-[15px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>cloud_done</span>
              <span className="font-code-sm text-code-sm tracking-tight text-text-secondary">Saved</span>
            </div>
          </div>
          <div className="flex items-center gap-space-xs">
            <button onClick={onSave} className="inline-flex items-center gap-space-xs px-space-sm py-1 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-all shadow-sm" type="button">
              <span className="material-symbols-outlined text-[16px]">save</span>
              <span className="font-label-md text-label-md hidden sm:inline">Save</span>
            </button>
            <button onClick={handleExportPdf} className="inline-flex items-center gap-space-xs px-space-sm py-1 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-all shadow-sm" type="button">
              <span className="material-symbols-outlined text-[16px]">download</span>
              <span className="font-label-md text-label-md hidden sm:inline">Export PDF</span>
            </button>
            <button onClick={handlePrint} className="inline-flex items-center gap-space-xs px-space-sm py-1 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-all shadow-sm" type="button">
              <span className="material-symbols-outlined text-[16px]">print</span>
              <span className="font-label-md text-label-md hidden sm:inline">Print</span>
            </button>
          </div>
        </div>
      </div>

      {/* Document Master Canvas */}
      <div className="w-full max-w-screen-2xl mx-auto px-6 md:px-16 lg:px-24 pt-space-xl flex flex-col gap-space-xl">
        <section className="flex flex-col gap-space-md">
          {/* Title Input */}
          <input
            className="w-full mb-3 px-3 py-2 bg-transparent border-none text-on-surface font-display-hero text-display-hero tracking-tight outline-none focus:ring-0 selection:bg-primary-fixed"
            placeholder="Document Title"
            value={title}
            onChange={handleTitleChange}
          />
          
          {/* Tags Section */}
          <div className="flex flex-wrap items-center gap-space-xs pt-space-xs">
            {tags.map((tag, index) => (
              <span 
                key={index} 
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm shadow-sm"
              >
                <span className="text-primary font-code-sm text-code-sm">#</span>{tag}
                <button 
                  className="text-error hover:text-error/80 ml-1" 
                  onClick={() => removeTag(tag)}
                >
                  ×
                </button>
              </span>
            ))}
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-text-tertiary">
              <input
                className="bg-transparent border-none outline-none font-label-sm text-label-sm w-24 placeholder:text-text-tertiary"
                placeholder="Add Tag..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <button 
                onClick={addTag} 
                className="text-on-surface-variant hover:text-on-surface"
              >
                +
              </button>
            </div>
          </div>
        </section>

        {/* Editor Container */}
        <div className="enhanced-editor-container w-full min-h-[60vh]">
          <RichTextEditor
            key={`editor-${note.id}`}
            output="html"
            content={content}
            onChangeContent={onValueChange}
            extensions={extensions}
            dark={resolvedTheme === 'dark'}
            disabled={false}
            bubbleMenu={{
              render({ extensionsNames, editor, disabled }: any, bubbleDefaultDom: any) {
                return <>
                  {bubbleDefaultDom}
                  {extensionsNames.includes('twitter') ? <BubbleMenuTwitter disabled={disabled} editor={editor} key="twitter" /> : null}
                  {extensionsNames.includes('katex') ? <BubbleMenuKatex disabled={disabled} editor={editor} key="katex" /> : null}
                  {extensionsNames.includes('excalidraw') ? <BubbleMenuExcalidraw disabled={disabled} editor={editor} key="excalidraw" /> : null}
                  {extensionsNames.includes('mermaid') ? <BubbleMenuMermaid disabled={disabled} editor={editor} key="mermaid" /> : null}
                  {extensionsNames.includes('drawer') ? <BubbleMenuDrawer disabled={disabled} editor={editor} key="drawer" /> : null}
                </>
              },
            }}
          />
        </div>
      </div>

      <aside className="fixed bottom-6 inset-x-0 mx-auto w-fit z-40">
        <div className="flex items-center gap-space-md px-space-md py-1.5 rounded-full bg-surface-container-lowest/90 backdrop-blur-md shadow-lg text-text-secondary font-label-md text-label-md">
          <div className="flex items-center gap-space-xs">
            <span className="w-2 h-2 rounded-full bg-primary"></span>
            <span className="text-on-surface font-semibold">{note.content ? note.content.replace(/<[^>]*>/g, '').split(' ').length : 0}</span> words
          </div>
          <div className="w-1 h-1 rounded-full bg-outline-variant"></div>
          <div>{Math.max(1, Math.ceil((note.content ? note.content.replace(/<[^>]*>/g, '').split(' ').length : 0) / 200))} min read</div>
          <div className="w-1 h-1 rounded-full bg-outline-variant"></div>
          <div className="flex items-center gap-1 text-text-tertiary">
            <span className="material-symbols-outlined text-[14px]">sync</span>
            <span>Markdown synced</span>
          </div>
        </div>
      </aside>
    </div>
  )
}
