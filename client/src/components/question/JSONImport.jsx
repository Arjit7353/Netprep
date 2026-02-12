import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileJson, 
  AlertCircle, 
  CheckCircle,
  Copy,
  Download,
  Eye,
  Play,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import Button from '../common/Button';
import { Spinner } from '../common/Loader';
import { useToast } from '../common/Toast';
import { ALL_TEMPLATES } from '../../utils/jsonTemplates';
import { validateJSONImport } from '../../utils/validators';
import { downloadJSON, copyToClipboard } from '../../utils/helpers';

const JSONImport = ({
  onImport,
  onValidate,
  language = 'hi',
  loading = false
}) => {
  const { success, error: showError, warning } = useToast();
  const fileInputRef = useRef(null);
  
  const [jsonText, setJsonText] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [validation, setValidation] = useState(null);
  const [preview, setPreview] = useState(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  // Template options
  const templateOptions = Object.entries(ALL_TEMPLATES).map(([key, value]) => ({
    value: key,
    label: value.name,
    labelHi: value.nameHi
  }));

  // Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      showError('Please upload a JSON file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target.result;
        JSON.parse(content); // Validate JSON
        setJsonText(content);
        setValidation(null);
        setPreview(null);
        success('File loaded successfully');
      } catch (err) {
        showError('Invalid JSON file');
      }
    };
    reader.readAsText(file);
    
    // Reset file input
    e.target.value = '';
  };

  // Handle template selection
  const handleTemplateSelect = (templateKey) => {
    if (!templateKey) return;
    
    const template = ALL_TEMPLATES[templateKey];
    if (template) {
      setJsonText(JSON.stringify(template.template, null, 2));
      setSelectedTemplate(templateKey);
      setValidation(null);
      setPreview(null);
    }
  };

  // Validate JSON
  const handleValidate = async () => {
    if (!jsonText.trim()) {
      showError('Please enter or upload JSON data');
      return;
    }

    let jsonData;
    try {
      jsonData = JSON.parse(jsonText);
    } catch (err) {
      showError('Invalid JSON format: ' + err.message);
      setValidation({ isValid: false, errors: ['Invalid JSON format: ' + err.message], warnings: [] });
      return;
    }

    // Client-side validation
    const clientValidation = validateJSONImport(jsonData);
    
    if (!clientValidation.isValid) {
      setValidation(clientValidation);
      showError(clientValidation.errors[0]);
      return;
    }

    // Server-side validation
    setIsValidating(true);
    try {
      const response = await onValidate(jsonData);
      setValidation(response.validation);
      setPreview(response.preview);
      
      if (response.validation.isValid) {
        success('JSON is valid and ready to import');
      } else {
        showError(response.validation.errors[0] || 'Validation failed');
      }
      
      if (response.validation.warnings?.length > 0) {
        response.validation.warnings.forEach(w => warning(w));
      }
    } catch (err) {
      showError(err.message || 'Validation failed');
      setValidation({ isValid: false, errors: [err.message], warnings: [] });
    } finally {
      setIsValidating(false);
    }
  };

  // Import JSON
  const handleImport = async () => {
    if (!validation?.isValid) {
      showError('Please validate JSON first');
      return;
    }

    try {
      const jsonData = JSON.parse(jsonText);
      await onImport(jsonData);
      success('Questions imported successfully!');
      
      // Clear form
      setJsonText('');
      setValidation(null);
      setPreview(null);
      setSelectedTemplate('');
    } catch (err) {
      showError(err.message || 'Import failed');
    }
  };

  // Copy template
  const handleCopyTemplate = async () => {
    if (await copyToClipboard(jsonText)) {
      success('Copied to clipboard');
    } else {
      showError('Failed to copy');
    }
  };

  // Download template
  const handleDownloadTemplate = () => {
    try {
      const data = JSON.parse(jsonText);
      downloadJSON(data, `netprep-template-${selectedTemplate || 'custom'}.json`);
      success('Downloaded successfully');
    } catch (err) {
      showError('Invalid JSON');
    }
  };

  // Format JSON
  const handleFormatJSON = () => {
    try {
      const data = JSON.parse(jsonText);
      setJsonText(JSON.stringify(data, null, 2));
      success('JSON formatted');
    } catch (err) {
      showError('Invalid JSON format');
    }
  };

  return (
    <div className="space-y-6">
      {/* Templates Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <button
          type="button"
          onClick={() => setShowTemplates(!showTemplates)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <FileJson className="w-5 h-5 text-primary-600" />
            <h3 className="font-medium text-gray-900">
              {language === 'hi' ? 'JSON टेम्पलेट' : 'JSON Templates'}
            </h3>
          </div>
          {showTemplates ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </button>

        {showTemplates && (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-gray-600">
              {language === 'hi' 
                ? 'प्रश्न प्रकार के अनुसार टेम्पलेट चुनें:'
                : 'Select a template based on question type:'
              }
            </p>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {templateOptions.map((template) => (
                <button
                  key={template.value}
                  type="button"
                  onClick={() => handleTemplateSelect(template.value)}
                  className={`
                    p-3 text-sm rounded-lg border transition-all text-left
                    ${selectedTemplate === template.value
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }
                  `}
                >
                  {language === 'hi' ? template.labelHi : template.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Upload & Editor Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-900">
            {language === 'hi' ? 'JSON डेटा' : 'JSON Data'}
          </h3>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={Upload}
              onClick={() => fileInputRef.current?.click()}
            >
              {language === 'hi' ? 'फ़ाइल अपलोड' : 'Upload File'}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </div>

        {/* JSON Editor */}
        <div className="relative">
          <textarea
            value={jsonText}
            onChange={(e) => {
              setJsonText(e.target.value);
              setValidation(null);
              setPreview(null);
            }}
            rows={15}
            className="w-full px-4 py-3 font-mono text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            placeholder={language === 'hi' 
              ? 'JSON यहाँ पेस्ट करें या ऊपर से टेम्पलेट चुनें...'
              : 'Paste JSON here or select a template above...'
            }
          />
          
          {jsonText && (
            <div className="absolute top-2 right-2 flex items-center gap-1">
              <button
                type="button"
                onClick={handleFormatJSON}
                className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded text-gray-600"
                title="Format JSON"
              >
                <FileJson className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleCopyTemplate}
                className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded text-gray-600"
                title="Copy"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded text-gray-600"
                title="Download"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setJsonText('');
                  setValidation(null);
                  setPreview(null);
                }}
                className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded text-gray-600"
                title="Clear"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-500">
            {jsonText && (
              <span>
                {jsonText.length.toLocaleString()} {language === 'hi' ? 'अक्षर' : 'characters'}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              icon={Eye}
              onClick={handleValidate}
              loading={isValidating}
              disabled={!jsonText.trim()}
            >
              {language === 'hi' ? 'मान्य करें' : 'Validate'}
            </Button>
            <Button
              variant="primary"
              icon={Play}
              onClick={handleImport}
              loading={loading}
              disabled={!validation?.isValid}
            >
              {language === 'hi' ? 'आयात करें' : 'Import'}
            </Button>
          </div>
        </div>
      </div>

      {/* Validation Results */}
      {validation && (
        <div className={`rounded-xl border p-4 ${
          validation.isValid 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center gap-2 mb-3">
            {validation.isValid ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600" />
            )}
            <h4 className={`font-medium ${validation.isValid ? 'text-green-800' : 'text-red-800'}`}>
              {validation.isValid 
                ? (language === 'hi' ? 'मान्यता सफल' : 'Validation Successful')
                : (language === 'hi' ? 'मान्यता विफल' : 'Validation Failed')
              }
            </h4>
          </div>

          {/* Errors */}
          {validation.errors?.length > 0 && (
            <div className="space-y-1 mb-3">
              {validation.errors.map((error, index) => (
                <p key={index} className="text-sm text-red-700 flex items-start gap-2">
                  <span className="text-red-500">•</span>
                  {error}
                </p>
              ))}
            </div>
          )}

          {/* Warnings */}
          {validation.warnings?.length > 0 && (
            <div className="space-y-1 mb-3">
              {validation.warnings.map((warn, index) => (
                <p key={index} className="text-sm text-yellow-700 flex items-start gap-2">
                  <span className="text-yellow-500">⚠</span>
                  {warn}
                </p>
              ))}
            </div>
          )}

          {/* Preview */}
          {preview && (
            <div className="mt-4 pt-4 border-t border-green-200">
              <h5 className="text-sm font-medium text-green-800 mb-2">
                {language === 'hi' ? 'आयात पूर्वावलोकन:' : 'Import Preview:'}
              </h5>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-600">{preview.totalQuestions || 0}</p>
                  <p className="text-xs text-gray-600">
                    {language === 'hi' ? 'कुल प्रश्न' : 'Total Questions'}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-blue-600">{preview.passages || 0}</p>
                  <p className="text-xs text-gray-600">
                    {language === 'hi' ? 'गद्यांश' : 'Passages'}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-purple-600">{preview.diData || 0}</p>
                  <p className="text-xs text-gray-600">
                    {language === 'hi' ? 'DI सेट' : 'DI Sets'}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-orange-600">
                    {Object.keys(preview.byType || {}).length}
                  </p>
                  <p className="text-xs text-gray-600">
                    {language === 'hi' ? 'प्रश्न प्रकार' : 'Question Types'}
                  </p>
                </div>
              </div>

              {/* By Type Breakdown */}
              {preview.byType && Object.keys(preview.byType).length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-green-700 mb-2">
                    {language === 'hi' ? 'प्रकार के अनुसार:' : 'By Type:'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(preview.byType).map(([type, count]) => (
                      <span 
                        key={type}
                        className="px-2 py-1 bg-white text-xs rounded-full text-gray-700"
                      >
                        {type}: {count}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default JSONImport;