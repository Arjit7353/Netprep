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
  ChevronUp,
  SkipForward,
  AlertTriangle
} from 'lucide-react';
import Button from '../common/Button';
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
  // ✅ NEW: Skip duplicates toggle
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [showDuplicates, setShowDuplicates] = useState(false);

  const templateOptions = Object.entries(ALL_TEMPLATES).map(([key, value]) => ({
    value: key,
    label: value.name,
    labelHi: value.nameHi
  }));

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
        JSON.parse(content);
        setJsonText(content);
        setValidation(null);
        setPreview(null);
        success('File loaded successfully');
      } catch (err) {
        showError('Invalid JSON file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

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
      setValidation({
        isValid: false,
        errors: ['Invalid JSON format: ' + err.message],
        warnings: []
      });
      return;
    }

    const clientValidation = validateJSONImport(jsonData);
    if (!clientValidation.isValid) {
      setValidation(clientValidation);
      showError(clientValidation.errors[0]);
      return;
    }

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
        response.validation.warnings.slice(0, 3).forEach(w => warning(w));
      }
    } catch (err) {
      showError(err.message || 'Validation failed');
      setValidation({
        isValid: false,
        errors: [err.message],
        warnings: []
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleImport = async () => {
    if (!validation?.isValid) {
      showError('Please validate JSON first');
      return;
    }

    try {
      const jsonData = JSON.parse(jsonText);
      // ✅ Pass skipDuplicates flag
      jsonData._skipDuplicates = skipDuplicates;
      await onImport(jsonData);

      setJsonText('');
      setValidation(null);
      setPreview(null);
      setSelectedTemplate('');
    } catch (err) {
      showError(err.message || 'Import failed');
    }
  };

  const handleCopyTemplate = async () => {
    if (await copyToClipboard(jsonText)) {
      success('Copied to clipboard');
    } else {
      showError('Failed to copy');
    }
  };

  const handleDownloadTemplate = () => {
    try {
      const data = JSON.parse(jsonText);
      downloadJSON(data, `netprep-template-${selectedTemplate || 'custom'}.json`);
      success('Downloaded successfully');
    } catch (err) {
      showError('Invalid JSON');
    }
  };

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
      <div className="bg-white dark:bg-secondary-800 rounded-xl border border-gray-200 dark:border-secondary-700 p-4">
        <button
          type="button"
          onClick={() => setShowTemplates(!showTemplates)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <FileJson className="w-5 h-5 text-primary-600" />
            <h3 className="font-medium text-gray-900 dark:text-white">
              {language === 'hi' ? 'JSON टेम्पलेट' : 'JSON Templates'}
            </h3>
          </div>
          {showTemplates
            ? <ChevronUp className="w-5 h-5 text-gray-500" />
            : <ChevronDown className="w-5 h-5 text-gray-500" />
          }
        </button>

        {showTemplates && (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-gray-600 dark:text-secondary-400">
              {language === 'hi'
                ? 'प्रश्न प्रकार के अनुसार टेम्पलेट चुनें:'
                : 'Select a template based on question type:'}
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
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                      : 'border-gray-200 dark:border-secondary-600 hover:border-gray-300 text-gray-700 dark:text-secondary-300'
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

      {/* Upload & Editor */}
      <div className="bg-white dark:bg-secondary-800 rounded-xl border border-gray-200 dark:border-secondary-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-900 dark:text-white">
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
            className="w-full px-4 py-3 font-mono text-sm border border-gray-300 dark:border-secondary-600 dark:bg-secondary-700 dark:text-secondary-100 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
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
                className="p-1.5 bg-gray-100 dark:bg-secondary-600 hover:bg-gray-200 dark:hover:bg-secondary-500 rounded text-gray-600 dark:text-secondary-300"
                title="Format JSON"
              >
                <FileJson className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleCopyTemplate}
                className="p-1.5 bg-gray-100 dark:bg-secondary-600 hover:bg-gray-200 dark:hover:bg-secondary-500 rounded text-gray-600 dark:text-secondary-300"
                title="Copy"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="p-1.5 bg-gray-100 dark:bg-secondary-600 hover:bg-gray-200 dark:hover:bg-secondary-500 rounded text-gray-600 dark:text-secondary-300"
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
                className="p-1.5 bg-gray-100 dark:bg-secondary-600 hover:bg-gray-200 dark:hover:bg-secondary-500 rounded text-gray-600 dark:text-secondary-300"
                title="Clear"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* ✅ NEW: Skip Duplicates Toggle */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-secondary-700">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={skipDuplicates}
                  onChange={(e) => setSkipDuplicates(e.target.checked)}
                  className="sr-only"
                />
                <div
                  className={`w-10 h-5 rounded-full transition-colors ${
                    skipDuplicates ? 'bg-primary-600' : 'bg-gray-300 dark:bg-secondary-600'
                  }`}
                  onClick={() => setSkipDuplicates(!skipDuplicates)}
                >
                  <div className={`
                    absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow
                    transition-transform duration-200
                    ${skipDuplicates ? 'translate-x-5' : 'translate-x-0'}
                  `} />
                </div>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700 dark:text-secondary-300">
                  {language === 'hi' ? 'डुप्लिकेट प्रश्न छोड़ें' : 'Skip Duplicate Questions'}
                </span>
                <p className="text-xs text-gray-500 dark:text-secondary-400">
                  {language === 'hi'
                    ? 'पहले से मौजूद प्रश्नों को दोबारा import नहीं करेगा'
                    : 'Will not re-import already existing questions'
                  }
                </p>
              </div>
            </label>
          </div>

          <div className="flex items-center gap-2">
            {jsonText && (
              <span className="text-xs text-gray-500 dark:text-secondary-400">
                {jsonText.length.toLocaleString()} chars
              </span>
            )}
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
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
        }`}>
          <div className="flex items-center gap-2 mb-3">
            {validation.isValid
              ? <CheckCircle className="w-5 h-5 text-green-600" />
              : <AlertCircle className="w-5 h-5 text-red-600" />
            }
            <h4 className={`font-medium ${
              validation.isValid
                ? 'text-green-800 dark:text-green-300'
                : 'text-red-800 dark:text-red-300'
            }`}>
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
                <p key={index} className="text-sm text-red-700 dark:text-red-400 flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">•</span>
                  {error}
                </p>
              ))}
            </div>
          )}

          {/* Warnings */}
          {validation.warnings?.length > 0 && (
            <div className="space-y-1 mb-3">
              {validation.warnings.map((warn, index) => (
                <p key={index} className="text-sm text-yellow-700 dark:text-yellow-400 flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-yellow-500 mt-0.5 flex-shrink-0" />
                  {warn}
                </p>
              ))}
            </div>
          )}

          {/* ✅ Preview with FIXED passage count */}
          {preview && (
            <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-800">
              <h5 className="text-sm font-medium text-green-800 dark:text-green-300 mb-3">
                {language === 'hi' ? 'आयात पूर्वावलोकन:' : 'Import Preview:'}
              </h5>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <div className="bg-white dark:bg-secondary-800 rounded-lg p-3 text-center border border-green-100 dark:border-green-900">
                  <p className="text-2xl font-bold text-green-600">{preview.totalQuestions || 0}</p>
                  <p className="text-xs text-gray-600 dark:text-secondary-400 mt-1">
                    {language === 'hi' ? 'कुल प्रश्न' : 'Total Questions'}
                  </p>
                </div>
                <div className="bg-white dark:bg-secondary-800 rounded-lg p-3 text-center border border-blue-100 dark:border-blue-900">
                  <p className="text-2xl font-bold text-blue-600">{preview.passages || 0}</p>
                  <p className="text-xs text-gray-600 dark:text-secondary-400 mt-1">
                    {language === 'hi' ? 'गद्यांश सेट' : 'Passage Sets'}
                  </p>
                </div>
                <div className="bg-white dark:bg-secondary-800 rounded-lg p-3 text-center border border-purple-100 dark:border-purple-900">
                  <p className="text-2xl font-bold text-purple-600">{preview.diData || 0}</p>
                  <p className="text-xs text-gray-600 dark:text-secondary-400 mt-1">
                    {language === 'hi' ? 'DI सेट' : 'DI Sets'}
                  </p>
                </div>
                <div className="bg-white dark:bg-secondary-800 rounded-lg p-3 text-center border border-orange-100 dark:border-orange-900">
                  <p className="text-2xl font-bold text-orange-600">
                    {Object.keys(preview.byType || {}).length}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-secondary-400 mt-1">
                    {language === 'hi' ? 'प्रश्न प्रकार' : 'Question Types'}
                  </p>
                </div>
              </div>

              {/* By Type */}
              {preview.byType && Object.keys(preview.byType).length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-medium text-green-700 dark:text-green-400 mb-2">
                    {language === 'hi' ? 'प्रकार के अनुसार:' : 'By Type:'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(preview.byType).map(([type, count]) => (
                      <span
                        key={type}
                        className="px-2.5 py-1 bg-white dark:bg-secondary-700 text-xs rounded-full text-gray-700 dark:text-secondary-300 border border-gray-200 dark:border-secondary-600"
                      >
                        <span className="font-medium">{type}:</span> {count}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* ✅ NEW: Duplicate Warning in Preview */}
              {preview.duplicates && preview.duplicates.found > 0 && (
                <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                        {preview.duplicates.found} {language === 'hi' ? 'डुप्लिकेट मिले' : 'Duplicates Found'}
                        {skipDuplicates && (
                          <span className="ml-2 text-xs font-normal text-yellow-600">
                            ({language === 'hi' ? 'छोड़ दिए जाएंगे' : 'will be skipped'})
                          </span>
                        )}
                      </span>
                    </div>
                    {preview.duplicates.list?.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowDuplicates(!showDuplicates)}
                        className="text-xs text-yellow-700 dark:text-yellow-400 underline"
                      >
                        {showDuplicates
                          ? (language === 'hi' ? 'छुपाएं' : 'Hide')
                          : (language === 'hi' ? 'देखें' : 'Show')
                        }
                      </button>
                    )}
                  </div>

                  {showDuplicates && preview.duplicates.list?.length > 0 && (
                    <div className="space-y-2 mt-2">
                      {preview.duplicates.list.map((dup, i) => (
                        <div
                          key={i}
                          className="text-xs bg-white dark:bg-secondary-700 rounded p-2 border border-yellow-100 dark:border-yellow-900"
                        >
                          <p className="text-gray-600 dark:text-secondary-400">
                            <span className="font-medium text-yellow-700 dark:text-yellow-400">
                              {language === 'hi' ? 'मौजूद Q.' : 'Existing Q.'}
                              {dup.existingNumber}:
                            </span>{' '}
                            {dup.existingText}
                          </p>
                          <p className="text-gray-500 dark:text-secondary-500 mt-1">
                            <span className="font-medium">
                              {language === 'hi' ? 'Input: ' : 'Input: '}
                            </span>
                            {dup.inputQuestion}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
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