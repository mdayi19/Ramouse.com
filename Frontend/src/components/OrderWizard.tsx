
import React from 'react';
import { Navigate } from 'react-router-dom';
import { OrderFormData, Category, Brand, Settings, PartType } from '../types';
import ProgressBar from './ProgressBar';
import Step1Category from './Step1Category';
import Step2Brand from './Step2Brand';
import Step3Model from './Step3Model';
import Step4PartType from './Step4PartType';
import Step5Details from './Step5Details';
import Step6Review from './Step6Review';
import Step7Success from './Step7Success';

interface Props {
    currentStep: number;
    totalSteps: number;
    stepNames: string[];
    formData: OrderFormData;
    updateFormData: (data: Partial<OrderFormData>) => void;
    nextStep: () => void;
    prevStep: () => void;
    goToStep: (step: number) => void;
    submitForm: () => void;
    resetForm: () => void;
    isSubmitting: boolean;
    orderNumber: string | null;
    carCategories: Category[];
    allBrands: Brand[];
    brandModels: { [key: string]: string[] };
    partTypes: PartType[];
    settings: Settings;
}

const OrderWizard: React.FC<Props> = ({
    currentStep,
    totalSteps,
    stepNames,
    formData,
    updateFormData,
    nextStep,
    prevStep,
    goToStep,
    submitForm,
    resetForm,
    isSubmitting,
    orderNumber,
    carCategories,
    allBrands,
    brandModels,
    partTypes,
    settings
}) => {

    React.useEffect(() => {
        window.scrollTo(0, 0);
    }, [currentStep]);

    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return <Step1Category updateFormData={updateFormData} nextStep={nextStep} carCategories={carCategories} />;
            case 2:
                return <Step2Brand formData={formData} updateFormData={updateFormData} nextStep={nextStep} prevStep={prevStep} carCategories={carCategories} allBrands={allBrands} />;
            case 3:
                return <Step3Model formData={formData} updateFormData={updateFormData} nextStep={nextStep} prevStep={prevStep} brandModels={brandModels} />;
            case 4:
                return <Step4PartType formData={formData} updateFormData={updateFormData} nextStep={nextStep} prevStep={prevStep} partTypes={partTypes} />;
            case 5:
                return <Step5Details formData={formData} updateFormData={updateFormData} nextStep={nextStep} prevStep={prevStep} settings={settings} />;
            case 6:
                return <Step6Review formData={formData} prevStep={prevStep} submitForm={submitForm} goToStep={goToStep} isSubmitting={isSubmitting} />;
            case 7:
                return <Step7Success resetForm={resetForm} orderNumber={orderNumber} />;
            default:
                return <Navigate to="/" />;
        }
    };

    return (
        <div className="w-full max-w-5xl mx-auto">
            {currentStep > 0 && currentStep <= totalSteps && (
                <ProgressBar
                    currentStep={currentStep}
                    totalSteps={totalSteps}
                    stepNames={stepNames}
                    goToStep={goToStep}
                />
            )}
            <div className="mt-6">
                {renderStep()}
            </div>
        </div>
    );
};

export default OrderWizard;
