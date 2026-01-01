import React, { useState, useEffect } from 'react';
import {
    FileText, Trash2, Folder, Download, Play, File, HardDrive, XCircle
} from 'lucide-react';
import { api } from '../../lib/api';

interface FileManagerProps {
    onDelete: () => void;
    showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const FileManager: React.FC<FileManagerProps> = ({ onDelete, showToast }) => {
    const [path, setPath] = useState('/');
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });
    const [previewFile, setPreviewFile] = useState<any | null>(null);

    const fetchFiles = async (dirPath: string) => {
        setLoading(true);
        setSelectedFiles([]);
        try {
            const response = await api.get('/admin/maintenance/files', { params: { path: dirPath } });
            setItems(response.data.data);
            setPath(dirPath);
        } catch (error) {
            console.error("فشل تحميل الملفات", error);
            showToast('فشل تحميل الملفات', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFiles(path);
    }, []);

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedItems = React.useMemo(() => {
        let sortableItems = [...items];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        // Directories always first
        return sortableItems.sort((a, b) => {
            if (a.type === 'folder' && b.type === 'file') return -1;
            if (a.type === 'file' && b.type === 'folder') return 1;
            return 0;
        });
    }, [items, sortConfig]);

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedFiles(items.filter(i => i.type === 'file').map(i => i.path));
        } else {
            setSelectedFiles([]);
        }
    };

    const handleSelectFile = (filePath: string) => {
        if (selectedFiles.includes(filePath)) {
            setSelectedFiles(selectedFiles.filter(p => p !== filePath));
        } else {
            setSelectedFiles([...selectedFiles, filePath]);
        }
    };

    const handleBulkDelete = async () => {
        if (!window.confirm(`هل أنت متأكد من حذف ${selectedFiles.length} ملفات؟`)) return;
        try {
            await api.post('/admin/maintenance/files/bulk-delete', { paths: selectedFiles });
            fetchFiles(path);
            setSelectedFiles([]);
            onDelete();
            showToast('تم حذف الملفات المحددة', 'success');
        } catch (error) {
            showToast('فشل الحذف الجماعي', 'error');
        }
    };

    const handleDelete = async (filePath: string) => {
        if (!window.confirm('هل أنت متأكد من نقل هذا الملف إلى سلة المهملات؟')) return;
        try {
            await api.delete('/admin/maintenance/files', { data: { path: filePath } });
            fetchFiles(path);
            onDelete();
            showToast('تم نقل الملف إلى سلة المهملات', 'success');
        } catch (error) {
            showToast('فشل حذف الملف', 'error');
        }
    };

    const handleDownload = async (filePath: string) => {
        window.open(`${api.defaults.baseURL}/admin/maintenance/files/download?path=${encodeURIComponent(filePath)}`, '_blank');
    };

    const breadcrumbs = path.split('/').filter(p => p);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6" dir="rtl">
            {/* Header / Toolbar */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap">
                    <button onClick={() => fetchFiles('/')} className="text-blue-600 hover:underline flex items-center">
                        <HardDrive className="w-4 h-4 ml-1" /> الجذر
                    </button>
                    {breadcrumbs.map((part, index) => {
                        const currentPath = '/' + breadcrumbs.slice(0, index + 1).join('/');
                        return (
                            <React.Fragment key={currentPath}>
                                <span className="text-gray-400">/</span>
                                <button onClick={() => fetchFiles(currentPath)} className="text-blue-600 hover:underline">
                                    {part}
                                </button>
                            </React.Fragment>
                        );
                    })}
                </div>

                <div className="flex gap-2">
                    {selectedFiles.length > 0 && (
                        <button onClick={handleBulkDelete} className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-sm hover:bg-red-100 flex items-center gap-2">
                            <Trash2 className="w-4 h-4" /> حذف المحدد ({selectedFiles.length})
                        </button>
                    )}
                </div>
            </div>

            {/* File List */}
            <div className="overflow-x-auto min-h-[400px]">
                <table className="w-full text-sm text-right">
                    <thead>
                        <tr className="border-b bg-gray-50 text-gray-500">
                            <th className="p-3 w-10">
                                <input type="checkbox" onChange={handleSelectAll} checked={selectedFiles.length > 0 && selectedFiles.length === items.filter(i => i.type === 'file').length} />
                            </th>
                            <th className="p-3 cursor-pointer hover:text-gray-900" onClick={() => handleSort('name')}>
                                الاسم {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </th>
                            <th className="p-3 cursor-pointer hover:text-gray-900" onClick={() => handleSort('size')}>
                                الحجم {sortConfig.key === 'size' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </th>
                            <th className="p-3 cursor-pointer hover:text-gray-900" onClick={() => handleSort('last_modified')}>
                                التاريخ {sortConfig.key === 'last_modified' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </th>
                            <th className="p-3 text-left">إجراءات</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={5} className="p-8 text-center text-gray-500">جاري التحميل...</td></tr>
                        ) : sortedItems.length === 0 ? (
                            <tr><td colSpan={5} className="p-8 text-center text-gray-500">المجلد فارغ</td></tr>
                        ) : sortedItems.map((item: any, idx) => (
                            <tr key={idx} className={`group hover:bg-blue-50 ${selectedFiles.includes(item.path) ? 'bg-blue-50' : ''}`}>
                                <td className="p-3">
                                    {item.type === 'file' && (
                                        <input
                                            type="checkbox"
                                            checked={selectedFiles.includes(item.path)}
                                            onChange={() => handleSelectFile(item.path)}
                                        />
                                    )}
                                </td>
                                <td className="p-3">
                                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => item.type === 'folder' ? fetchFiles(item.path) : setPreviewFile(item)}>
                                        {item.type === 'folder' ? (
                                            <Folder className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                                        ) : (
                                            getFileIcon(item.extension)
                                        )}
                                        <span className={item.type === 'folder' ? 'font-medium text-gray-900' : 'text-gray-700'}>
                                            {item.name}
                                        </span>
                                    </div>
                                </td>
                                <td className="p-3 text-gray-500" dir="ltr">{item.size || '-'}</td>
                                <td className="p-3 text-gray-500" dir="ltr">{item.last_modified}</td>
                                <td className="p-3 text-left opacity-0 group-hover:opacity-100 transition-opacity flex justify-end gap-2">
                                    {item.type === 'file' && (
                                        <>
                                            <button onClick={() => setPreviewFile(item)} className="p-1 hover:bg-gray-200 rounded" title="معاينة">
                                                <Play className="w-4 h-4 text-blue-500" />
                                            </button>
                                            <button onClick={() => handleDownload(item.path)} className="p-1 hover:bg-gray-200 rounded" title="تحميل">
                                                <Download className="w-4 h-4 text-gray-600" />
                                            </button>
                                            <button onClick={() => handleDelete(item.path)} className="p-1 hover:bg-red-100 rounded" title="حذف">
                                                <Trash2 className="w-4 h-4 text-red-500" />
                                            </button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* File Preview Modal */}
            {previewFile && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setPreviewFile(null)}>
                    <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b flex justify-between items-center">
                            <h3 className="font-bold text-lg truncate flex items-center gap-2">
                                {getFileIcon(previewFile.extension)}
                                {previewFile.name}
                            </h3>
                            <button onClick={() => setPreviewFile(null)} className="text-gray-500 hover:text-gray-700">
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-4 flex-1 overflow-auto bg-gray-100 flex items-center justify-center min-h-[300px]">
                            <PreviewContent file={previewFile} />
                        </div>
                        <div className="p-4 border-t bg-gray-50 flex justify-between text-sm text-gray-500">
                            <span>الحجم: {previewFile.size}</span>
                            <div className="flex gap-2">
                                <button onClick={() => handleDownload(previewFile.path)} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">تحميل</button>
                                <button onClick={() => setPreviewFile(null)} className="px-4 py-2 border rounded hover:bg-gray-100">إغلاق</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Helper: Get Icon based on extension
const getFileIcon = (ext: string) => {
    const e = ext?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(e)) return <FileText className="w-5 h-5 text-purple-500" />;
    if (['mp4', 'webm', 'mov'].includes(e)) return <Play className="w-5 h-5 text-red-500" />;
    if (['pdf'].includes(e)) return <FileText className="w-5 h-5 text-red-600" />;
    if (['txt', 'log', 'md', 'json'].includes(e)) return <FileText className="w-5 h-5 text-gray-500" />;
    return <File className="w-5 h-5 text-gray-400" />;
};

// Helper: Preview Content
const PreviewContent: React.FC<{ file: any }> = ({ file }) => {
    const ext = file.extension?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
        return <img src={file.url} alt="Preview" className="max-w-full max-h-full object-contain" />;
    }
    if (['mp4', 'webm', 'mov'].includes(ext)) {
        return <video src={file.url} controls className="max-w-full max-h-[600px] rounded-lg" />;
    }
    if (['mp3', 'wav', 'ogg'].includes(ext)) {
        return <audio src={file.url} controls className="w-full max-w-md" />;
    }
    if (['txt', 'log', 'md', 'json'].includes(ext)) {
        return <iframe src={file.url} className="w-full h-[500px] bg-white border rounded" title="Text Preview" />;
    }
    return <div className="text-gray-500 flex flex-col items-center gap-2">
        <File className="w-16 h-16 text-gray-300" />
        <p>لا يمكن معاينة هذا النوع من الملفات</p>
    </div>;
};

export default FileManager;
