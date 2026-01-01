
import React, { useState, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Vehicle } from '../types';
import Modal from './Modal';

interface VehicleInfoModalProps {
    vehicle: Vehicle;
    onClose: () => void;
}

const VehicleInfoModal: React.FC<VehicleInfoModalProps> = ({ vehicle, onClose }) => {
    const [result, setResult] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const getInfo = async () => {
            setIsLoading(true);
            setError('');
            setResult('');

            try {
                const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
                const model = genAI.getGenerativeModel({
                    model: "gemini-2.0-flash-exp",
                    systemInstruction: `You are an expert car mechanic providing helpful information in clear, well-formatted Arabic. Use headings for "نصائح الصيانة", "المشاكل الشائعة", and "حقائق مثيرة للاهتمام". Use numbered or bulleted lists.`
                });

                const prompt = `قدم نصائح صيانة مفيدة، والمشاكل الشائعة، وحقائق مثيرة للاهتمام لسيارة ${vehicle.year} ${vehicle.brand} ${vehicle.model} بمحرك ${vehicle.engineType}. يجب أن تكون الإجابة باللغة العربية، ومنسقة جيدًا بعناوين رئيسية وقوائم.`;

                const response = await model.generateContent(prompt);
                setResult(response.response.text() || 'لم يتم استلام رد من النموذج.');


            } catch (err) {
                console.error(err);
                setError('عذراً، حدث خطأ أثناء جلب المعلومات. يرجى المحاولة مرة أخرى.');
            } finally {
                setIsLoading(false);
            }
        };

        getInfo();
    }, [vehicle]);

    return (
        <Modal title={`معلومات عن ${vehicle.brand} ${vehicle.model}`} onClose={onClose}>
            {isLoading && (
                <div className="flex flex-col items-center justify-center p-8">
                    <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-primary mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">جاري تحليل بيانات مركبتك باستخدام Gemini 3 Pro...</p>
                </div>
            )}
            {error && <p className="text-center text-red-600 dark:text-red-400 p-8">{error}</p>}
            {result && (
                <div className="prose prose-sm dark:prose-invert max-w-none text-right">
                    <pre className="whitespace-pre-wrap font-sans bg-transparent p-0">{result}</pre>
                </div>
            )}
        </Modal>
    );
};

export default VehicleInfoModal;
