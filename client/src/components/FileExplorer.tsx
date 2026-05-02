import React, { useEffect, useState } from 'react';
import { getRoomFiles, addFileToRoom } from '../services/room';
import { Folder, File, FolderPlus, FilePlus } from 'lucide-react';

interface FileExplorerProps {
    roomId: string;
    onFileSelect: (fileId: string) => void;
    selectedFileId?: string;
}

const FileExplorer: React.FC<FileExplorerProps> = ({ roomId, onFileSelect, selectedFileId }) => {
    const [files, setFiles] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchFiles();
    }, [roomId]);

    const fetchFiles = async () => {
        setIsLoading(true);
        try {
            const data = await getRoomFiles(roomId);
            if (data.success) {
                setFiles(data.data);
                // If no file is selected and we have files, select the first file
                if (!selectedFileId && data.data.length > 0) {
                    const firstFile = data.data.find((f: any) => f.type === 'file');
                    if (firstFile) onFileSelect(firstFile._id);
                }
            }
        } catch (err) {
            console.error('Failed to fetch files:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateFile = async (type: 'file' | 'folder') => {
        const name = prompt(`Enter ${type} name:`);
        if (!name) return;

        try {
            const data = await addFileToRoom(roomId, { name, type });
            console.log('FileExplorer: Create file response:', data);
            if (data.success) {
                console.log('FileExplorer: Refreshing files for roomId:', roomId);
                await fetchFiles();
                if (type === 'file') onFileSelect(data.data._id);
            } else {
                console.warn('FileExplorer: Create file failed:', data.error);
            }
        } catch (err) {
            console.error('Failed to create file:', err);
        }
    };

    return (
        <div className="w-64 h-full bg-gray-900/80 border-r border-gray-800 flex flex-col text-sm backdrop-blur-sm">
            <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-gray-900/50">
                <span className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-bold">Explorer</span>
                <div className="flex gap-1">
                    <button 
                        onClick={() => handleCreateFile('file')} 
                        className="p-1.5 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-blue-400 transition-all duration-200" 
                        title="New File"
                    >
                        <FilePlus size={14} />
                    </button>
                    <button 
                        onClick={() => handleCreateFile('folder')} 
                        className="p-1.5 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-yellow-400 transition-all duration-200" 
                        title="New Folder"
                    >
                        <FolderPlus size={14} />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-gray-800 hover:scrollbar-thumb-gray-700">
                {isLoading ? (
                    <div className="space-y-2 p-2">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="h-7 bg-gray-800/30 rounded-md animate-pulse" />
                        ))}
                    </div>
                ) : files.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 opacity-30">
                        <Folder size={32} className="mb-2" />
                        <p className="text-[10px] uppercase tracking-widest">Empty Room</p>
                    </div>
                ) : (
                    <div className="space-y-0.5">
                        {files.map((file) => (
                            <button
                                key={file._id}
                                onClick={() => file.type === 'file' && onFileSelect(file._id)}
                                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-200 group ${
                                    selectedFileId === file._id 
                                    ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' 
                                    : 'hover:bg-gray-800/50 text-gray-400 hover:text-gray-200'
                                }`}
                            >
                                <div className="shrink-0 transition-transform group-hover:scale-110">
                                    {file.type === 'folder' ? (
                                        <Folder size={14} className={selectedFileId === file._id ? 'text-yellow-500' : 'text-yellow-500/50'} />
                                    ) : (
                                        <File size={14} className={selectedFileId === file._id ? 'text-blue-500' : 'text-blue-500/50'} />
                                    )}
                                </div>
                                <span className="truncate flex-1 text-left font-medium text-xs">{file.name}</span>
                                {selectedFileId === file._id && (
                                    <div className="w-1 h-1 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FileExplorer;
