from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count, F, Q
from django.db import models
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal


class SalesReportView(APIView):
    """Sales Report API"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        from apps.invoices.models import Invoice
        
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if not start_date:
            start_date = timezone.now().date().replace(day=1)
        if not end_date:
            end_date = timezone.now().date()
        
        invoices = Invoice.objects.filter(
            invoice_date__gte=start_date,
            invoice_date__lte=end_date
        ).exclude(status='cancelled')
        
        summary = invoices.aggregate(
            total_invoices=Count('id'),
            total_sales=Sum('total'),
            total_received=Sum('received'),
            total_pending=Sum('balance'),
            total_tax=Sum('tax_amount'),
            total_discount=Sum('discount_amount')
        )
        
        # Daily breakdown
        daily_sales = invoices.values('invoice_date').annotate(
            count=Count('id'),
            total=Sum('total')
        ).order_by('invoice_date')
        
        return Response({
            'period': {'start': start_date, 'end': end_date},
            'summary': {
                'total_invoices': summary['total_invoices'] or 0,
                'total_sales': float(summary['total_sales'] or 0),
                'total_received': float(summary['total_received'] or 0),
                'total_pending': float(summary['total_pending'] or 0),
                'total_tax': float(summary['total_tax'] or 0),
                'total_discount': float(summary['total_discount'] or 0),
            },
            'daily_breakdown': list(daily_sales)
        })


class PurchaseReportView(APIView):
    """Purchase Report API"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        from apps.purchases.models import Purchase, Expense
        
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if not start_date:
            start_date = timezone.now().date().replace(day=1)
        if not end_date:
            end_date = timezone.now().date()
        
        purchases = Purchase.objects.filter(
            purchase_date__gte=start_date,
            purchase_date__lte=end_date
        ).exclude(status='cancelled')
        
        purchase_summary = purchases.aggregate(
            total_purchases=Count('id'),
            total_amount=Sum('total'),
            total_paid=Sum('paid'),
            total_pending=Sum('balance')
        )
        
        expenses = Expense.objects.filter(
            expense_date__gte=start_date,
            expense_date__lte=end_date
        )
        
        expense_summary = expenses.aggregate(
            total_expenses=Count('id'),
            total_amount=Sum('amount')
        )
        
        return Response({
            'period': {'start': start_date, 'end': end_date},
            'purchases': {
                'count': purchase_summary['total_purchases'] or 0,
                'total': float(purchase_summary['total_amount'] or 0),
                'paid': float(purchase_summary['total_paid'] or 0),
                'pending': float(purchase_summary['total_pending'] or 0),
            },
            'expenses': {
                'count': expense_summary['total_expenses'] or 0,
                'total': float(expense_summary['total_amount'] or 0),
            }
        })


class ProfitLossReportView(APIView):
    """Profit & Loss Report API"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        from apps.invoices.models import Invoice
        from apps.purchases.models import Purchase, Expense
        
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if not start_date:
            start_date = timezone.now().date().replace(day=1)
        if not end_date:
            end_date = timezone.now().date()
        
        # Income
        sales = Invoice.objects.filter(
            invoice_date__gte=start_date,
            invoice_date__lte=end_date
        ).exclude(status='cancelled').aggregate(
            total=Sum('subtotal')
        )['total'] or 0
        
        # Cost of goods
        purchases = Purchase.objects.filter(
            purchase_date__gte=start_date,
            purchase_date__lte=end_date
        ).exclude(status='cancelled').aggregate(
            total=Sum('subtotal')
        )['total'] or 0
        
        gross_profit = float(sales) - float(purchases)
        
        # Expenses
        expenses = Expense.objects.filter(
            expense_date__gte=start_date,
            expense_date__lte=end_date
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        net_profit = gross_profit - float(expenses)
        
        # Expense breakdown
        expense_breakdown = Expense.objects.filter(
            expense_date__gte=start_date,
            expense_date__lte=end_date
        ).values('category').annotate(total=Sum('amount'))
        
        return Response({
            'period': {'start': start_date, 'end': end_date},
            'income': {
                'sales': float(sales),
            },
            'cost_of_goods': {
                'purchases': float(purchases),
            },
            'gross_profit': gross_profit,
            'expenses': {
                'total': float(expenses),
                'breakdown': list(expense_breakdown)
            },
            'net_profit': net_profit,
            'profit_margin': round((net_profit / float(sales) * 100) if sales else 0, 2)
        })


class GSTReportView(APIView):
    """GST Report API"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        from apps.invoices.models import Invoice, InvoiceItem
        
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if not start_date:
            start_date = timezone.now().date().replace(day=1)
        if not end_date:
            end_date = timezone.now().date()
        
        invoices = Invoice.objects.filter(
            invoice_date__gte=start_date,
            invoice_date__lte=end_date
        ).exclude(status='cancelled')
        
        # Output tax (sales)
        output_tax = invoices.aggregate(
            cgst=Sum('cgst_amount'),
            sgst=Sum('sgst_amount'),
            igst=Sum('igst_amount'),
            total=Sum('tax_amount')
        )
        
        # Tax rate breakdown
        tax_breakdown = InvoiceItem.objects.filter(
            invoice__invoice_date__gte=start_date,
            invoice__invoice_date__lte=end_date
        ).exclude(invoice__status='cancelled').values('tax_rate').annotate(
            taxable_amount=Sum(F('quantity') * F('price') - F('discount_amount')),
            tax_amount=Sum('tax_amount')
        ).order_by('tax_rate')
        
        return Response({
            'period': {'start': start_date, 'end': end_date},
            'output_tax': {
                'cgst': float(output_tax['cgst'] or 0),
                'sgst': float(output_tax['sgst'] or 0),
                'igst': float(output_tax['igst'] or 0),
                'total': float(output_tax['total'] or 0),
            },
            'rate_breakdown': list(tax_breakdown)
        })


class StockReportView(APIView):
    """Stock/Inventory Report API"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        from apps.products.models import Product, Category
        
        try:
            products = Product.objects.filter(is_active=True)
            
            # Summary - handle potential None values
            summary = products.aggregate(
                total_products=Count('id'),
                total_quantity=Sum('quantity'),
                total_value=Sum(F('quantity') * F('purchase_price'))
            )
            
            low_stock = products.filter(quantity__lte=F('min_stock')).count()
            out_of_stock = products.filter(quantity=0).count()
            
            # Category breakdown
            category_breakdown = products.values(
                'category__name'
            ).annotate(
                count=Count('id'),
                quantity=Sum('quantity'),
                value=Sum(F('quantity') * F('purchase_price'))
            )
            
            # Low stock items
            low_stock_items = products.filter(
                quantity__lte=F('min_stock')
            ).values('id', 'name', 'sku', 'quantity', 'min_stock')[:20]
            
            return Response({
                'summary': {
                    'total_products': summary['total_products'] or 0,
                    'total_quantity': summary['total_quantity'] or 0,
                    'total_value': float(summary['total_value'] or 0),
                    'low_stock_count': low_stock,
                    'out_of_stock_count': out_of_stock,
                },
                'category_breakdown': list(category_breakdown),
                'low_stock_items': list(low_stock_items)
            })
        except Exception as e:
            # Return empty data on error to prevent 500
            print(f"StockReportView error: {e}")
            return Response({
                'summary': {
                    'total_products': 0,
                    'total_quantity': 0,
                    'total_value': 0,
                    'low_stock_count': 0,
                    'out_of_stock_count': 0,
                },
                'category_breakdown': [],
                'low_stock_items': []
            })


class DashboardDataView(APIView):
    """Aggregated Dashboard Data API - OPTIMIZED"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        from apps.invoices.models import Invoice
        from apps.payments.models import Payment
        from apps.purchases.models import Expense
        from apps.customers.models import Customer
        from apps.products.models import Product
        
        today = timezone.now().date()
        month_start = today.replace(day=1)
        last_month_start = (month_start - timedelta(days=1)).replace(day=1)
        week_ago = today - timedelta(days=6)
        
        # ===== OPTIMIZED: Single query for all invoice aggregations =====
        invoice_stats = Invoice.objects.exclude(status='cancelled').aggregate(
            today_sales=Sum('total', filter=models.Q(invoice_date=today)),
            monthly_sales=Sum('total', filter=models.Q(invoice_date__gte=month_start)),
            last_month_sales=Sum('total', filter=models.Q(
                invoice_date__gte=last_month_start,
                invoice_date__lt=month_start
            )),
            pending_receivable=Sum('balance', filter=models.Q(status__in=['pending', 'partial']))
        )
        
        today_sales = invoice_stats['today_sales'] or 0
        monthly_sales = invoice_stats['monthly_sales'] or 0
        last_month_sales = invoice_stats['last_month_sales'] or 0
        pending_receivable = invoice_stats['pending_receivable'] or 0
        
        # Today's collections
        today_collections = Payment.objects.filter(
            payment_date=today
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        # ===== OPTIMIZED: Single query for 7-day sales trend =====
        sales_by_day = Invoice.objects.filter(
            invoice_date__gte=week_ago,
            invoice_date__lte=today
        ).exclude(status='cancelled').values('invoice_date').annotate(
            total=Sum('total')
        ).order_by('invoice_date')
        
        # Build sales_trend with all 7 days (fill missing days with 0)
        sales_dict = {item['invoice_date']: float(item['total']) for item in sales_by_day}
        sales_trend = []
        for i in range(6, -1, -1):
            date = today - timedelta(days=i)
            sales_trend.append({
                'date': date.strftime('%Y-%m-%d'),
                'day': date.strftime('%a'),
                'amount': sales_dict.get(date, 0)
            })
        
        # Payment mode breakdown
        payment_modes = Payment.objects.filter(
            payment_date__gte=month_start
        ).values('mode').annotate(total=Sum('amount'))
        
        # Top customers (limited to 5)
        top_customers = Invoice.objects.filter(
            invoice_date__gte=month_start
        ).exclude(status='cancelled').values(
            'customer__id', 'customer__name'
        ).annotate(
            total=Sum('total')
        ).order_by('-total')[:5]
        
        # ===== JOB ORDER METRICS (replacing low stock) =====
        from apps.joborders.models import JobOrder
        
        total_customers = Customer.objects.count()
        
        # Job order counts by status
        job_order_stats = JobOrder.objects.aggregate(
            pending=Count('id', filter=models.Q(status='pending')),
            in_progress=Count('id', filter=models.Q(status='in_progress')),
            completed=Count('id', filter=models.Q(status='completed')),
            overdue=Count('id', filter=models.Q(
                status__in=['pending', 'in_progress'],
                expected_delivery__lt=today
            )),
            today_delivery=Count('id', filter=models.Q(
                expected_delivery=today,
                status__in=['pending', 'in_progress', 'ready']
            ))
        )
        
        # Calculate growth safely
        growth = 0
        if last_month_sales:
            growth = round(((float(monthly_sales) - float(last_month_sales)) / float(last_month_sales) * 100), 1)
        
        return Response({
            'today': {
                'sales': float(today_sales),
                'collections': float(today_collections),
                'date': today.strftime('%Y-%m-%d')
            },
            'monthly': {
                'sales': float(monthly_sales),
                'last_month_sales': float(last_month_sales),
                'growth': growth
            },
            'pending': {
                'receivable': float(pending_receivable),
            },
            'counts': {
                'customers': total_customers,
            },
            'job_orders': {
                'pending': job_order_stats['pending'] or 0,
                'in_progress': job_order_stats['in_progress'] or 0,
                'completed': job_order_stats['completed'] or 0,
                'overdue': job_order_stats['overdue'] or 0,
                'today_delivery': job_order_stats['today_delivery'] or 0,
            },
            'charts': {
                'sales_trend': sales_trend,
                'payment_modes': list(payment_modes),
                'top_customers': list(top_customers),
            }
        })

