import io
import calendar
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch, mm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT


def generate_pay_slip_pdf(payslip, company_name, company_address='', company_phone=''):
    """Generate a professional pay slip PDF"""
    
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=30,
        leftMargin=30,
        topMargin=30,
        bottomMargin=30,
    )
    
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'PaySlipTitle',
        parent=styles['Heading1'],
        fontSize=18,
        alignment=TA_CENTER,
        spaceAfter=5,
        textColor=colors.HexColor('#1E40AF'),
    )
    
    subtitle_style = ParagraphStyle(
        'PaySlipSubtitle',
        parent=styles['Normal'],
        fontSize=10,
        alignment=TA_CENTER,
        spaceAfter=2,
        textColor=colors.HexColor('#6B7280'),
    )
    
    heading_style = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading3'],
        fontSize=12,
        textColor=colors.HexColor('#1E40AF'),
        spaceBefore=15,
        spaceAfter=8,
    )
    
    label_style = ParagraphStyle(
        'Label',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor('#374151'),
    )
    
    value_style = ParagraphStyle(
        'Value',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor('#111827'),
        fontName='Helvetica-Bold',
    )
    
    amount_style = ParagraphStyle(
        'Amount',
        parent=styles['Normal'],
        fontSize=10,
        alignment=TA_RIGHT,
    )
    
    total_style = ParagraphStyle(
        'TotalAmount',
        parent=styles['Normal'],
        fontSize=13,
        alignment=TA_RIGHT,
        fontName='Helvetica-Bold',
        textColor=colors.HexColor('#059669'),
    )
    
    elements = []
    
    # Company Header
    elements.append(Paragraph(company_name, title_style))
    if company_address:
        elements.append(Paragraph(company_address, subtitle_style))
    if company_phone:
        elements.append(Paragraph(f"Phone: {company_phone}", subtitle_style))
    
    elements.append(Spacer(1, 5))
    elements.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor('#1E40AF')))
    elements.append(Spacer(1, 5))
    
    # Pay Slip Title
    month_name = calendar.month_name[payslip.month]
    elements.append(Paragraph(
        f"PAY SLIP — {month_name} {payslip.year}",
        ParagraphStyle('PSTitle', parent=styles['Heading2'], alignment=TA_CENTER, fontSize=14, spaceAfter=15)
    ))
    
    # Employee Details
    elements.append(Paragraph("Employee Details", heading_style))
    
    emp_data = [
        [Paragraph("Name", label_style), Paragraph(payslip.staff.name, value_style),
         Paragraph("Role", label_style), Paragraph(payslip.staff.get_role_display(), value_style)],
        [Paragraph("Salary Type", label_style), 
         Paragraph(payslip.staff.get_salary_type_display(), value_style),
         Paragraph("Rate", label_style),
         Paragraph(
             f"₹{payslip.staff.daily_rate:,.2f}/day" if payslip.staff.salary_type == 'daily' 
             else f"₹{payslip.staff.monthly_salary:,.2f}/month",
             value_style
         )],
    ]
    
    if payslip.staff.bank_account:
        emp_data.append([
            Paragraph("Bank Account", label_style), Paragraph(payslip.staff.bank_account, value_style),
            Paragraph("Bank", label_style), Paragraph(payslip.staff.bank_name or '-', value_style),
        ])
    
    emp_table = Table(emp_data, colWidths=[1.5*inch, 2.2*inch, 1.3*inch, 2.2*inch])
    emp_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F9FAFB')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E5E7EB')),
        ('PADDING', (0, 0), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    elements.append(emp_table)
    
    # Attendance Summary
    elements.append(Paragraph("Attendance Summary", heading_style))
    
    att_data = [
        [Paragraph("<b>Detail</b>", label_style), Paragraph("<b>Days</b>", amount_style)],
        [Paragraph("Days Present", label_style), Paragraph(str(payslip.days_present), amount_style)],
        [Paragraph("Half Days", label_style), Paragraph(str(payslip.half_days), amount_style)],
        [Paragraph("Days Absent", label_style), Paragraph(str(payslip.days_absent), amount_style)],
        [Paragraph("Leaves", label_style), Paragraph(str(payslip.leaves), amount_style)],
        [Paragraph("Overtime Hours", label_style), Paragraph(f"{payslip.overtime_hours}", amount_style)],
    ]
    
    att_table = Table(att_data, colWidths=[5*inch, 2.2*inch])
    att_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1E40AF')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E5E7EB')),
        ('PADDING', (0, 0), (-1, -1), 8),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F9FAFB')]),
    ]))
    elements.append(att_table)
    
    # Salary Calculation
    elements.append(Paragraph("Salary Calculation", heading_style))
    
    sal_data = [
        [Paragraph("<b>Description</b>", label_style), Paragraph("<b>Amount (₹)</b>", amount_style)],
        [Paragraph("Gross Salary", label_style), Paragraph(f"₹{payslip.gross_salary:,.2f}", amount_style)],
        [Paragraph("Overtime Amount", label_style), Paragraph(f"₹{payslip.overtime_amount:,.2f}", amount_style)],
        [Paragraph("Deductions", label_style), Paragraph(f"- ₹{payslip.deductions:,.2f}", amount_style)],
    ]
    
    sal_table = Table(sal_data, colWidths=[5*inch, 2.2*inch])
    sal_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1E40AF')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E5E7EB')),
        ('PADDING', (0, 0), (-1, -1), 8),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F9FAFB')]),
    ]))
    elements.append(sal_table)
    
    # Net Salary
    elements.append(Spacer(1, 10))
    net_data = [
        [Paragraph("<b>NET SALARY</b>", ParagraphStyle('NetLabel', parent=styles['Normal'], fontSize=13, fontName='Helvetica-Bold')),
         Paragraph(f"<b>₹{payslip.net_salary:,.2f}</b>", total_style)],
    ]
    net_table = Table(net_data, colWidths=[5*inch, 2.2*inch])
    net_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#ECFDF5')),
        ('BOX', (0, 0), (-1, -1), 1.5, colors.HexColor('#059669')),
        ('PADDING', (0, 0), (-1, -1), 12),
    ]))
    elements.append(net_table)
    
    # Payment Status
    elements.append(Spacer(1, 15))
    status_text = "PAID" if payslip.payment_status == 'paid' else "PENDING"
    status_color = '#059669' if payslip.payment_status == 'paid' else '#DC2626'
    elements.append(Paragraph(
        f"Payment Status: <font color='{status_color}'><b>{status_text}</b></font>",
        ParagraphStyle('Status', parent=styles['Normal'], fontSize=11, alignment=TA_CENTER)
    ))
    
    if payslip.payment_status == 'paid' and payslip.paid_date:
        elements.append(Paragraph(
            f"Paid on: {payslip.paid_date.strftime('%d-%b-%Y')} | Mode: {payslip.payment_mode}",
            ParagraphStyle('PaidInfo', parent=styles['Normal'], fontSize=9, alignment=TA_CENTER, textColor=colors.HexColor('#6B7280'))
        ))
    
    # Footer
    elements.append(Spacer(1, 30))
    elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#D1D5DB')))
    elements.append(Paragraph(
        "This is a computer-generated pay slip and does not require a signature.",
        ParagraphStyle('Footer', parent=styles['Normal'], fontSize=8, alignment=TA_CENTER, textColor=colors.HexColor('#9CA3AF'))
    ))
    
    doc.build(elements)
    buffer.seek(0)
    return buffer
