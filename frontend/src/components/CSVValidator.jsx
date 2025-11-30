// src/components/CSVValidator.jsx
import React, { useState } from 'react'

const CSVValidator = ({ type, onValidCSV }) => {
  const [file, setFile] = useState(null)
  const [validation, setValidation] = useState(null)
  const [preview, setPreview] = useState(null)

  const expectedColumns = {
    upcoming: [
      'id',
      'age',
      'days_lps',
      'employed',
      'benefits',
      'driver',
      'vdu',
      'varifocal',
      'high_rx',
      'appointment_date'
    ],
    past: [
      'id',
      'age',
      'days_lps',
      'employed',
      'benefits',
      'driver',
      'vdu',
      'varifocal',
      'high_rx',
      'appointment_date',
      'amount_spent'
    ]
  }

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (!selectedFile) return

    setFile(selectedFile)
    validateCSV(selectedFile)
  }

  const validateCSV = (file) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const text = e.target.result
      const lines = text.split('\n').filter(line => line.trim())

      if (lines.length === 0) {
        setValidation({
          valid: false,
          error: 'CSV file is empty'
        })
        return
      }

      // Parse header
      const header = lines[0].split(',').map(h => h.trim().toLowerCase())
      const expected = expectedColumns[type]

      // Check for missing columns
      const missingColumns = expected.filter(col => !header.includes(col))
      const extraColumns = header.filter(col => !expected.includes(col))

      // Parse first 5 data rows for preview
      const dataRows = []
      for (let i = 1; i < Math.min(6, lines.length); i++) {
        const values = lines[i].split(',').map(v => v.trim())
        const row = {}
        header.forEach((col, idx) => {
          row[col] = values[idx] || ''
        })
        dataRows.push(row)
      }

      if (missingColumns.length > 0) {
        setValidation({
          valid: false,
          error: `Missing required columns: ${missingColumns.join(', ')}`,
          header,
          expected,
          missingColumns,
          extraColumns
        })
        setPreview(null)
        return
      }

      // Validate data types in first few rows
      const errors = []
      dataRows.forEach((row, idx) => {
        // Check date format (accept YYYY-MM-DD or YYYY-MM-DD HH:MM:SS)
        if (row.appointment_date && !row.appointment_date.match(/^\d{4}-\d{2}-\d{2}( \d{2}:\d{2}:\d{2})?$/)) {
          errors.push(`Row ${idx + 2}: appointment_date should be YYYY-MM-DD or YYYY-MM-DD HH:MM:SS format, got "${row.appointment_date}"`)
        }

        // Check numeric fields
        const numericFields = ['id', 'age', 'days_lps']
        if (type === 'past') numericFields.push('amount_spent')

        numericFields.forEach(field => {
          if (row[field] && isNaN(row[field])) {
            errors.push(`Row ${idx + 2}: ${field} should be numeric, got "${row[field]}"`)
          }
        })

        // Check boolean fields (should be 0, 1, true, false, TRUE, FALSE, Y, N)
        const boolFields = ['employed', 'benefits', 'driver', 'vdu', 'varifocal', 'high_rx']
        boolFields.forEach(field => {
          const val = row[field]?.toLowerCase()
          if (val && !['0', '1', 'true', 'false', 'y', 'n'].includes(val)) {
            errors.push(`Row ${idx + 2}: ${field} should be 0/1, true/false, or Y/N, got "${row[field]}"`)
          }
        })
      })

      setValidation({
        valid: errors.length === 0,
        error: errors.length > 0 ? errors[0] : null,
        allErrors: errors,
        header,
        expected,
        totalRows: lines.length - 1,
        extraColumns
      })

      setPreview(dataRows)
    }

    reader.readAsText(file)
  }

  const handleUpload = () => {
    if (validation?.valid && file) {
      onValidCSV(file)
    }
  }

  return (
    <div>
      <input
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="cyberpunk-input mb-1"
      />

      {validation && (
        <div style={{ marginTop: '15px' }}>
          {validation.valid ? (
            <div style={{
              padding: '15px',
              background: 'rgba(0, 255, 0, 0.1)',
              border: '2px solid #00ff00',
              borderRadius: '4px'
            }}>
              <div style={{ color: '#00ff00', fontWeight: 'bold', marginBottom: '10px' }}>
                ✓ CSV Valid!
              </div>
              <div style={{ fontSize: '0.9rem', color: '#cccccc' }}>
                • Found {validation.totalRows} data rows<br/>
                • All required columns present<br/>
                • Data format looks correct
              </div>
              {validation.extraColumns.length > 0 && (
                <div style={{ fontSize: '0.85rem', color: '#ffaa00', marginTop: '10px' }}>
                  ⚠ Extra columns (will be ignored): {validation.extraColumns.join(', ')}
                </div>
              )}
              <button
                className="cyberpunk-btn"
                onClick={handleUpload}
                style={{ marginTop: '15px', width: '100%' }}
              >
                Upload This File
              </button>
            </div>
          ) : (
            <div style={{
              padding: '15px',
              background: 'rgba(255, 0, 0, 0.1)',
              border: '2px solid #ff0000',
              borderRadius: '4px'
            }}>
              <div style={{ color: '#ff0000', fontWeight: 'bold', marginBottom: '10px' }}>
                ✗ CSV Invalid
              </div>
              <div style={{ fontSize: '0.9rem', color: '#cccccc', marginBottom: '10px' }}>
                {validation.error}
              </div>

              {validation.missingColumns && (
                <div style={{ fontSize: '0.85rem', marginTop: '10px' }}>
                  <div style={{ color: '#ff0000', marginBottom: '5px' }}>Missing columns:</div>
                  <div style={{ color: '#cccccc', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                    {validation.missingColumns.join(', ')}
                  </div>

                  <div style={{ color: '#ffaa00', marginTop: '10px', marginBottom: '5px' }}>Your CSV has these columns:</div>
                  <div style={{ color: '#cccccc', fontFamily: 'monospace', fontSize: '0.8rem', background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '4px' }}>
                    {validation.header.join(', ')}
                  </div>
                </div>
              )}

              {validation.allErrors && validation.allErrors.length > 0 && (
                <div style={{ fontSize: '0.85rem', marginTop: '10px' }}>
                  <div style={{ color: '#ff0000', marginBottom: '5px' }}>
                    All errors ({validation.allErrors.length}):
                  </div>
                  <div style={{
                    maxHeight: '150px',
                    overflowY: 'auto',
                    background: 'rgba(0,0,0,0.3)',
                    padding: '10px',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    fontFamily: 'monospace'
                  }}>
                    {validation.allErrors.map((err, idx) => (
                      <div key={idx} style={{ color: '#ff6666', marginBottom: '5px' }}>
                        • {err}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ fontSize: '0.85rem', marginTop: '15px', padding: '10px', background: 'rgba(0,0,0,0.3)', borderRadius: '4px' }}>
                <div style={{ color: '#00ffff', marginBottom: '5px' }}>Expected columns for {type} appointments:</div>
                <div style={{ color: '#cccccc', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                  {expectedColumns[type].join(', ')}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {preview && validation?.valid && (
        <div style={{ marginTop: '15px' }}>
          <div style={{ fontSize: '0.9rem', color: '#00ffff', marginBottom: '10px' }}>
            Preview (first 5 rows):
          </div>
          <div style={{ overflowX: 'auto', fontSize: '0.75rem' }}>
            <table className="cyberpunk-table">
              <thead>
                <tr>
                  {validation.header.map(col => (
                    <th key={col}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, idx) => (
                  <tr key={idx}>
                    {validation.header.map(col => (
                      <td key={col}>{row[col]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default CSVValidator