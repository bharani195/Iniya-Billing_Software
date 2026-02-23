"""PDF Bill Generation for Invoices - Professional Invoice Design"""

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image, HRFlowable
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from io import BytesIO
from decimal import Decimal
import os


def get_image_or_placeholder(image_field, width, height):
    """Load an image from an ImageField or return None."""
    if image_field and hasattr(image_field, 'path') and os.path.exists(image_field.path):
        try:
            return Image(image_field.path, width=width, height=height)
        except Exception:
            pass
    return None


# ===== PROFESSIONAL COLOR PALETTE =====
PRIMARY_BLUE = colors.HexColor('#1E3A5F')
ACCENT_GOLD = colors.HexColor('#D4A84B')
DARK_TEXT = colors.HexColor('#2C3E50')
LIGHT_TEXT = colors.HexColor('#7F8C8D')
WHITE = colors.HexColor('#FFFFFF')
LIGHT_BG = colors.HexColor('#F8F9FA')
TABLE_HEADER_BG = colors.HexColor('#1E3A5F')
TABLE_ROW_ALT = colors.HexColor('#F1F5F9')
BORDER_LIGHT = colors.HexColor('#E2E8F0')


def number_to_words(num):
    """Convert number to Indian currency words"""
    ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
            'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
            'Seventeen', 'Eighteen', 'Nineteen']
    tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
    
    if num == 0: return 'Zero'
    
    def convert(n):
        if n < 20: return ones[n]
        elif n < 100: return tens[n // 10] + ('' if n % 10 == 0 else ' ' + ones[n % 10])
        elif n < 1000: return ones[n // 100] + ' Hundred' + ('' if n % 100 == 0 else ' ' + convert(n % 100))
        elif n < 100000: return convert(n // 1000) + ' Thousand' + ('' if n % 1000 == 0 else ' ' + convert(n % 1000))
        elif n < 10000000: return convert(n // 100000) + ' Lakh' + ('' if n % 100000 == 0 else ' ' + convert(n % 100000))
        else: return convert(n // 10000000) + ' Crore' + ('' if n % 10000000 == 0 else ' ' + convert(n % 10000000))
    
    return convert(int(num))


def generate_invoice_bill(invoice):
    """Generate a professional invoice PDF"""
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer, 
        pagesize=A4,
        rightMargin=0.6*inch, 
        leftMargin=0.6*inch,
        topMargin=0.4*inch, 
        bottomMargin=0.4*inch
    )
    
    from apps.company.models import Company
    company = Company.get_default()
    
    elements = []
    
    # ===== STYLES =====
    styles = {
        'invoice_title': ParagraphStyle(
            'InvoiceTitle', fontSize=24, fontName='Helvetica-Bold', 
            textColor=PRIMARY_BLUE, alignment=TA_RIGHT, spaceAfter=4, leading=28
        ),
        'invoice_subtitle': ParagraphStyle(
            'InvoiceSubtitle', fontSize=9, fontName='Helvetica', 
            textColor=ACCENT_GOLD, alignment=TA_RIGHT, spaceBefore=0
        ),
        'company_name': ParagraphStyle(
            'CompanyName', fontSize=18, fontName='Helvetica-Bold', 
            textColor=PRIMARY_BLUE, leading=22
        ),
        'company_details': ParagraphStyle(
            'CompanyDetails', fontSize=9, textColor=LIGHT_TEXT, leading=14
        ),
        'section_header': ParagraphStyle(
            'SectionHeader', fontSize=10, fontName='Helvetica-Bold', 
            textColor=PRIMARY_BLUE, spaceBefore=10, spaceAfter=6
        ),
        'value': ParagraphStyle(
            'Value', fontSize=10, fontName='Helvetica-Bold', 
            textColor=DARK_TEXT, leading=14
        ),
        'normal': ParagraphStyle(
            'Normal', fontSize=10, textColor=DARK_TEXT, leading=14
        ),
        'table_header': ParagraphStyle(
            'TableHeader', fontSize=9, fontName='Helvetica-Bold', 
            textColor=WHITE, alignment=TA_CENTER
        ),
        'table_cell': ParagraphStyle(
            'TableCell', fontSize=9, textColor=DARK_TEXT
        ),
        'table_cell_right': ParagraphStyle(
            'TableCellRight', fontSize=9, textColor=DARK_TEXT, alignment=TA_RIGHT
        ),
        'table_cell_center': ParagraphStyle(
            'TableCellCenter', fontSize=9, textColor=DARK_TEXT, alignment=TA_CENTER
        ),
        'total_label': ParagraphStyle(
            'TotalLabel', fontSize=11, fontName='Helvetica-Bold', 
            textColor=DARK_TEXT, alignment=TA_RIGHT
        ),
        'total_value': ParagraphStyle(
            'TotalValue', fontSize=14, fontName='Helvetica-Bold', 
            textColor=PRIMARY_BLUE, alignment=TA_RIGHT
        ),
        'amount_words': ParagraphStyle(
            'AmountWords', fontSize=9, fontName='Helvetica-Oblique', 
            textColor=DARK_TEXT, alignment=TA_LEFT
        ),
        'footer_title': ParagraphStyle(
            'FooterTitle', fontSize=9, fontName='Helvetica-Bold', 
            textColor=PRIMARY_BLUE, spaceAfter=4
        ),
        'footer_text': ParagraphStyle(
            'FooterText', fontSize=8, textColor=DARK_TEXT, leading=12
        ),
        'signature_label': ParagraphStyle(
            'SignatureLabel', fontSize=9, textColor=DARK_TEXT, alignment=TA_CENTER
        ),
    }
    
    # ===== 1. HEADER SECTION =====
    logo_img = get_image_or_placeholder(company.logo, 1.2*inch, 1.2*inch)
    
    company_info = [
        Paragraph(f"<b>{company.name}</b>", styles['company_name']),
        Paragraph(f"{company.address}", styles['company_details']),
        Paragraph(f"{company.city} - {company.pincode}", styles['company_details']),
        Paragraph(f"Phone: {company.phone} | Email: {company.email}", styles['company_details']),
        Paragraph(f"GSTIN: {company.gstin}", styles['company_details']),
    ]
    
    invoice_no = invoice.invoice_number
    invoice_date = invoice.invoice_date.strftime('%d %b %Y')
    due_date_str = invoice.due_date.strftime('%d %b %Y') if invoice.due_date else 'On Receipt'
    
    invoice_type_map = {
        'invoice': 'TAX INVOICE',
        'quotation': 'QUOTATION',
        'proforma': 'PROFORMA INVOICE',
        'challan': 'DELIVERY CHALLAN',
        'credit_note': 'CREDIT NOTE'
    }
    invoice_type_display = invoice_type_map.get(invoice.invoice_type, 'TAX INVOICE')
    
    invoice_info = [
        Paragraph("INVOICE", styles['invoice_title']),
        Spacer(1, 2),
        Paragraph(invoice_type_display, styles['invoice_subtitle']),
        Spacer(1, 12),
        Paragraph(f"<font color='#7F8C8D'>Invoice No:</font> <b>{invoice_no}</b>", styles['normal']),
        Paragraph(f"<font color='#7F8C8D'>Date:</font> <b>{invoice_date}</b>", styles['normal']),
        Paragraph(f"<font color='#7F8C8D'>Due Date:</font> <b>{due_date_str}</b>", styles['normal']),
    ]
    
    if logo_img:
        header_data = [[logo_img, company_info, invoice_info]]
        header_table = Table(header_data, colWidths=[1.4*inch, 3*inch, 2.4*inch])
    else:
        header_data = [[company_info, invoice_info]]
        header_table = Table(header_data, colWidths=[4*inch, 2.8*inch])
    
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
    ]))
    elements.append(header_table)
    
    elements.append(Spacer(1, 15))
    elements.append(HRFlowable(width="100%", thickness=2, color=ACCENT_GOLD, spaceAfter=15))
    
    # ===== 2. BILL TO SECTION =====
    customer_name = invoice.customer.name if invoice.customer else "N/A"
    customer_mobile = invoice.customer.mobile if invoice.customer and invoice.customer.mobile else ""
    customer_address = invoice.billing_address or (invoice.customer.address if invoice.customer else "")
    customer_gstin = invoice.customer.gstin if invoice.customer and invoice.customer.gstin else ""
    
    bill_to_content = [
        Paragraph("BILL TO", styles['section_header']),
        Paragraph(f"<b>{customer_name}</b>", styles['value']),
    ]
    if customer_mobile:
        bill_to_content.append(Paragraph(f"Phone: {customer_mobile}", styles['normal']))
    if customer_address:
        bill_to_content.append(Paragraph(customer_address, styles['normal']))
    if customer_gstin:
        bill_to_content.append(Paragraph(f"<font color='#1E3A5F'><b>GSTIN: {customer_gstin}</b></font>", styles['normal']))
    
    status_display = invoice.status.capitalize() if invoice.status else 'Pending'
    
    invoice_details_content = [
        Paragraph("INVOICE STATUS", styles['section_header']),
        Paragraph(f"<font color='#7F8C8D'>Status:</font> <b>{status_display}</b>", styles['normal']),
    ]
    if invoice.received > 0:
        invoice_details_content.append(Paragraph(f"<font color='#7F8C8D'>Paid:</font> <b>Rs.{invoice.received:,.2f}</b>", styles['normal']))
    if invoice.balance > 0:
        invoice_details_content.append(Paragraph(f"<font color='#dc2626'><b>Balance Due: Rs.{invoice.balance:,.2f}</b></font>", styles['normal']))
    
    customer_table = Table([[bill_to_content, invoice_details_content]], colWidths=[3.4*inch, 3.4*inch])
    customer_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('BACKGROUND', (0, 0), (-1, -1), LIGHT_BG),
        ('BOX', (0, 0), (-1, -1), 0.5, BORDER_LIGHT),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ('LEFTPADDING', (0, 0), (-1, -1), 12),
        ('RIGHTPADDING', (0, 0), (-1, -1), 12),
    ]))
    elements.append(customer_table)
    elements.append(Spacer(1, 20))
    
    # ===== 3. ITEMS TABLE =====
    table_header = [
        Paragraph("<b>#</b>", styles['table_header']),
        Paragraph("<b>ITEM DESCRIPTION</b>", styles['table_header']),
        Paragraph("<b>QTY</b>", styles['table_header']),
        Paragraph("<b>RATE</b>", styles['table_header']),
        Paragraph("<b>TAX</b>", styles['table_header']),
        Paragraph("<b>AMOUNT</b>", styles['table_header']),
    ]
    table_data = [table_header]
    
    row_num = 1
    for item in invoice.items.all():
        rate = Decimal(str(item.price))
        qty = Decimal(str(item.quantity))
        tax_rate = Decimal(str(item.tax_rate or 0))
        amount = Decimal(str(item.total))
        
        qty_display = str(int(qty)) if qty == int(qty) else f"{qty:.2f}"
        tax_rate_display = int(tax_rate) if tax_rate == int(tax_rate) else f"{tax_rate:.2f}"
        tax_display = f"{tax_rate_display}%" if tax_rate > 0 else "-"
        
        desc = item.item_name
        if item.description:
            desc += f"<br/><font size=7 color='#7F8C8D'>{item.description}</font>"
        
        table_data.append([
            Paragraph(str(row_num), styles['table_cell_center']),
            Paragraph(desc, styles['table_cell']),
            Paragraph(qty_display, styles['table_cell_center']),
            Paragraph(f"Rs.{rate:,.2f}", styles['table_cell_right']),
            Paragraph(tax_display, styles['table_cell_center']),
            Paragraph(f"Rs.{amount:,.2f}", styles['table_cell_right']),
        ])
        row_num += 1
    
    while len(table_data) < 4:
        table_data.append(['', '', '', '', '', ''])
    
    items_table = Table(
        table_data, 
        colWidths=[0.4*inch, 2.4*inch, 0.6*inch, 1*inch, 0.7*inch, 1.2*inch]
    )
    
    table_style = [
        ('BACKGROUND', (0, 0), (-1, 0), TABLE_HEADER_BG),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
        ('TOPPADDING', (0, 0), (-1, 0), 10),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('TOPPADDING', (0, 1), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LINEBELOW', (0, 0), (-1, 0), 1, PRIMARY_BLUE),
        ('LINEBELOW', (0, 1), (-1, -2), 0.5, BORDER_LIGHT),
        ('LINEBELOW', (0, -1), (-1, -1), 1, BORDER_LIGHT),
        ('ALIGN', (0, 0), (0, -1), 'CENTER'),
        ('ALIGN', (2, 0), (2, -1), 'CENTER'),
        ('ALIGN', (4, 0), (4, -1), 'CENTER'),
        ('ALIGN', (3, 0), (3, -1), 'RIGHT'),
        ('ALIGN', (5, 0), (5, -1), 'RIGHT'),
    ]
    
    for i in range(1, len(table_data)):
        if i % 2 == 0:
            table_style.append(('BACKGROUND', (0, i), (-1, i), TABLE_ROW_ALT))
    
    items_table.setStyle(TableStyle(table_style))
    elements.append(items_table)
    elements.append(Spacer(1, 15))
    
    # ===== 4. SUMMARY SECTION =====
    subtotal = Decimal(str(invoice.subtotal or 0))
    tax_amount = Decimal(str(invoice.tax_amount or 0))
    discount = Decimal(str(invoice.discount_amount or 0))
    total_amount = Decimal(str(invoice.total or 0))
    received = Decimal(str(invoice.received or 0))
    balance = Decimal(str(invoice.balance or 0))
    
    summary_data = [
        ['', Paragraph("Subtotal:", styles['normal']), Paragraph(f"Rs.{subtotal:,.2f}", styles['table_cell_right'])],
    ]
    
    if discount > 0:
        summary_data.append(['', Paragraph("Discount:", styles['normal']), Paragraph(f"-Rs.{discount:,.2f}", styles['table_cell_right'])])
    
    if invoice.is_igst:
        igst_amount = Decimal(str(invoice.igst_amount or 0))
        if igst_amount > 0:
            summary_data.append(['', Paragraph("IGST:", styles['normal']), Paragraph(f"Rs.{igst_amount:,.2f}", styles['table_cell_right'])])
    else:
        cgst_amount = Decimal(str(invoice.cgst_amount or 0))
        sgst_amount = Decimal(str(invoice.sgst_amount or 0))
        if cgst_amount > 0:
            summary_data.append(['', Paragraph("CGST (2.5%):", styles['normal']), Paragraph(f"Rs.{cgst_amount:,.2f}", styles['table_cell_right'])])
        if sgst_amount > 0:
            summary_data.append(['', Paragraph("SGST (2.5%):", styles['normal']), Paragraph(f"Rs.{sgst_amount:,.2f}", styles['table_cell_right'])])
    
    summary_data.append(['', Paragraph("<b>GRAND TOTAL:</b>", styles['total_label']), Paragraph(f"<b>Rs.{total_amount:,.2f}</b>", styles['total_value'])])
    
    if received > 0:
        summary_data.append(['', Paragraph("Advance Paid:", styles['normal']), Paragraph(f"Rs.{received:,.2f}", styles['table_cell_right'])])
        summary_data.append(['', Paragraph("<b>Balance Due:</b>", styles['total_label']), Paragraph(f"<b>Rs.{balance:,.2f}</b>", styles['total_value'])])
    
    summary_table = Table(summary_data, colWidths=[3.0*inch, 1.8*inch, 2.0*inch])
    summary_table.setStyle(TableStyle([
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('ALIGN', (2, 0), (2, -1), 'RIGHT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    elements.append(summary_table)
    elements.append(Spacer(1, 8))
    
    # Amount in words
    amount_words = number_to_words(total_amount)
    elements.append(Paragraph(f"<i>Amount in words: {amount_words} Rupees Only</i>", styles['amount_words']))
    elements.append(Spacer(1, 25))
    
    # ===== 5. FOOTER =====
    signature_img = get_image_or_placeholder(company.signature, 1.3*inch, 0.5*inch)
    
    bank_content = [
        Paragraph("BANK DETAILS", styles['footer_title']),
        Paragraph(f"Bank: <b>{company.bank_name}</b>", styles['footer_text']),
        Paragraph(f"Branch: {company.branch}", styles['footer_text']),
        Paragraph(f"A/C No: <b>{company.account_number}</b>", styles['footer_text']),
        Paragraph(f"IFSC: <b>{company.ifsc_code}</b>", styles['footer_text']),
    ]
    
    terms_content = [
        Paragraph("NOTES", styles['footer_title']),
        Paragraph(invoice.notes or company.terms_and_conditions or "Thank you for your business!", styles['footer_text']),
    ]
    
    sig_elements = [
        Paragraph(f"For <b>{company.name}</b>", styles['signature_label']),
        Spacer(1, 8),
    ]
    if signature_img:
        sig_elements.append(signature_img)
    else:
        sig_elements.append(Spacer(1, 30))
    sig_elements.append(Spacer(1, 4))
    sig_elements.append(Paragraph("Authorized Signatory", styles['signature_label']))
    
    footer_table = Table(
        [[bank_content, terms_content, sig_elements]],
        colWidths=[2.3*inch, 2.4*inch, 2.1*inch]
    )
    footer_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ALIGN', (2, 0), (2, 0), 'CENTER'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('BOX', (0, 0), (-1, -1), 0.5, BORDER_LIGHT),
        ('BACKGROUND', (0, 0), (-1, -1), LIGHT_BG),
        ('LINEAFTER', (0, 0), (0, 0), 0.5, BORDER_LIGHT),
        ('LINEAFTER', (1, 0), (1, 0), 0.5, BORDER_LIGHT),
        ('LEFTPADDING', (0, 0), (0, 0), 12),
        ('LEFTPADDING', (1, 0), (1, 0), 12),
    ]))
    elements.append(footer_table)
    
    elements.append(Spacer(1, 20))
    thank_you_style = ParagraphStyle(
        'ThankYou', fontSize=10, fontName='Helvetica-Oblique', 
        textColor=LIGHT_TEXT, alignment=TA_CENTER
    )
    elements.append(Paragraph("Thank you for your business!", thank_you_style))
    
    doc.build(elements)
    buffer.seek(0)
    return buffer
