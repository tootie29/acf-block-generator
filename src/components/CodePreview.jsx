import { useMemo, useState } from 'react'
import { generateAllFiles } from '../generators/index.js'

export default function CodePreview({ schema }) {
  const [activeTab, setActiveTab] = useState('block.json')

  const files = useMemo(() => {
    try {
      return generateAllFiles(schema)
    } catch (err) {
      return { error: String(err) }
    }
  }, [schema])

  if (files.error) {
    return (
      <div>
        <div className="warn">Generation error: {files.error}</div>
      </div>
    )
  }

  const fileNames = Object.keys(files)
  const activeContent = files[activeTab] || files[fileNames[0]]

  const copyToClipboard = () => {
    navigator.clipboard.writeText(activeContent)
  }

  return (
    <div>
      <div className="tabs">
        {fileNames.map((name) => (
          <button
            key={name}
            className={`tab ${activeTab === name ? 'active' : ''}`}
            onClick={() => setActiveTab(name)}
          >
            {name}
          </button>
        ))}
      </div>
      <div className="actions">
        <button className="secondary" onClick={copyToClipboard}>
          Copy {activeTab}
        </button>
        <span className="hint right">
          Output folder: <code>gutenberg-blocks/{schema.slug || 'block-slug'}/</code>
        </span>
      </div>
      <div className="code-pane">
        <div className="filename">{activeTab}</div>
        <code>{activeContent}</code>
      </div>
    </div>
  )
}
