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
    index?: number;
}> = ({ order, actions, index = 0 }) => {
    return (
        <Card className="p-4 space-y-3 backdrop-blur-xl bg-white/80 dark:bg-darkcard/80 border-none shadow-lg hover:shadow-2xl transition-all duration-300 animate-fade-in" style={{ animationDelay: `${index * 30}ms` }}>
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
            {/* Gradient Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 p-8 shadow-lg">
                <div className="relative z-10">
                    <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                        <Icon name="Truck" className="w-8 h-8" />
                        إدارة الشحن والتوصيل
                    </h2>
                    <p className="text-white/90">متابعة الطلبات الجاهزة للشحن والتي هي قيد التوصيل</p>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            </div>

            {/* Stats Badges */}
            <div className="flex gap-3 justify-end">
                <div className="px-4 py-2 backdrop-blur-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl text-sm font-bold flex items-center gap-2 shadow-md border border-blue-200 dark:border-blue-800">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                    {readyToShipOrders.length} جاهز
                </div>
                <div className="px-4 py-2 backdrop-blur-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl text-sm font-bold flex items-center gap-2 shadow-md border border-amber-200 dark:border-amber-800">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                    {inTransitOrders.length} قيد الشحن
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Column 1: Ready to Ship */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md">
                        <Icon name="Box" className="w-5 h-5" />
                        <h3 className="text-lg font-bold">جاهزة للشحن</h3>
                    </div>
                    <div className="space-y-4">
                        {readyToShipOrders.length > 0 ? (
                            readyToShipOrders.map((order, index) => (
                                <OrderCard
                                    key={order.orderNumber}
                                    order={order}
                                    index={index}
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
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md">
                        <Icon name="Truck" className="w-5 h-5" />
                        <h3 className="text-lg font-bold">قيد التوصيل</h3>
                    </div>
                    <div className="space-y-4">
                        {inTransitOrders.length > 0 ? (
                            inTransitOrders.map((order, index) => (
                                <OrderCard
                                    key={order.orderNumber}
                                    order={order}
                                    index={index}
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
