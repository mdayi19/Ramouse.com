import React from 'react';
import { Order, OrderStatus, Settings } from '../../types';
import EmptyState from '../EmptyState';
import { StatusBadge } from './Shared';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import Icon from '../Icon';

interface ShippingViewProps {
    orders: Order[];
    onUpdateStatus: (orderNumber: string, newStatus: OrderStatus) => void;
    onOpenShippingReceipt: (order: Order) => void;
    settings: Settings;
}

const OrderCard: React.FC<{
    order: Order;
    actions: React.ReactNode;
}> = ({ order, actions }) => {
    return (
        <Card className="p-4 space-y-3 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-mono text-xs text-slate-500 mb-1">{order.orderNumber}</p>
                    <h4 className="font-bold text-slate-800 dark:text-slate-200">{order.customerName}</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1 mt-1">
                        <Icon name="MapPin" className="w-3 h-3" />
                        {order.customerAddress}
                    </p>
                </div>
                <StatusBadge status={order.status} />
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-sm border border-slate-100 dark:border-slate-700/50">
                <p className="font-semibold text-slate-700 dark:text-slate-300">{order.formData.partDescription}</p>
                <p className="text-xs text-slate-500 mt-1">{order.formData.brand} {order.formData.model}</p>
            </div>
            <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                {actions}
            </div>
        </Card>
    );
};

const ShippingView: React.FC<ShippingViewProps> = ({ orders, onUpdateStatus, onOpenShippingReceipt, settings }) => {

    const readyToShipOrders = React.useMemo(() =>
        orders.filter(o => o.status === 'تم الاستلام من المزود'),
        [orders]
    );

    const inTransitOrders = React.useMemo(() =>
        orders.filter(o => o.status === 'تم الشحن للعميل' || o.status === 'قيد التوصيل'),
        [orders]
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                        <Icon name="Truck" className="w-6 h-6 text-primary" />
                        إدارة الشحن والتوصيل
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">متابعة الطلبات الجاهزة للشحن والتي هي قيد التوصيل.</p>
                </div>
                <div className="flex gap-2">
                    <div className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-sm font-bold flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                        {readyToShipOrders.length} جاهز
                    </div>
                    <div className="px-3 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-lg text-sm font-bold flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                        {inTransitOrders.length} قيد الشحن
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Column 1: Ready to Ship */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <Icon name="Box" className="w-5 h-5" />
                        جاهزة للشحن
                    </h3>
                    <div className="space-y-4">
                        {readyToShipOrders.length > 0 ? (
                            readyToShipOrders.map(order => (
                                <OrderCard
                                    key={order.orderNumber}
                                    order={order}
                                    actions={
                                        <>
                                            <Button
                                                onClick={() => onOpenShippingReceipt(order)}
                                                variant="secondary"
                                                size="sm"
                                                className="flex-1"
                                                icon="Printer"
                                            >
                                                بوليصة الشحن
                                            </Button>
                                            <Button
                                                onClick={() => onUpdateStatus(order.orderNumber, 'تم الشحن للعميل')}
                                                variant="primary"
                                                size="sm"
                                                className="flex-1"
                                                icon="Check"
                                            >
                                                تم الشحن
                                            </Button>
                                        </>
                                    }
                                />
                            ))
                        ) : (
                            <EmptyState message="لا توجد طلبات جاهزة للشحن حالياً." />
                        )}
                    </div>
                </div>

                {/* Column 2: In Transit */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <Icon name="Truck" className="w-5 h-5" />
                        قيد التوصيل
                    </h3>
                    <div className="space-y-4">
                        {inTransitOrders.length > 0 ? (
                            inTransitOrders.map(order => (
                                <OrderCard
                                    key={order.orderNumber}
                                    order={order}
                                    actions={
                                        <>
                                            {order.status === 'تم الشحن للعميل' && (
                                                <Button
                                                    onClick={() => onUpdateStatus(order.orderNumber, 'قيد التوصيل')}
                                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                                                    size="sm"
                                                    icon="ArrowRight"
                                                >
                                                    إلى "قيد التوصيل"
                                                </Button>
                                            )}
                                            {order.status === 'قيد التوصيل' && (
                                                <Button
                                                    onClick={() => onUpdateStatus(order.orderNumber, 'تم التوصيل')}
                                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                                    size="sm"
                                                    icon="CheckCircle"
                                                >
                                                    إلى "تم التوصيل"
                                                </Button>
                                            )}
                                            <Button
                                                onClick={() => onOpenShippingReceipt(order)}
                                                variant="ghost"
                                                size="sm"
                                                icon="Printer"
                                            >
                                                طباعة
                                            </Button>
                                        </>
                                    }
                                />
                            ))
                        ) : (
                            <EmptyState message="لا توجد طلبات قيد التوصيل حالياً." />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShippingView;
