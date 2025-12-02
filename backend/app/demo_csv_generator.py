
import csv
import random
import io
from datetime import datetime, timedelta
from typing import Tuple


class DemoCSVGenerator:

    # Configuration
    PATIENTS_PER_DAY = 30
    PAST_DAYS = 60  # 2 months
    FUTURE_DAYS = 30  # 1 month
    
    @staticmethod
    def generate_age():
        #adults
        rand = random.random()
        if rand < 0.20:  # 20% young adults
            return random.randint(18, 30)
        elif rand < 0.45:  # 25% middle age
            return random.randint(31, 45)
        elif rand < 0.75:  # 30% older adults
            return random.randint(46, 60)
        else:  # 25% seniors
            return random.randint(61, 85)
    
    @staticmethod
    def generate_purchase_amount():
        #demo purchase amounts
        rand = random.random()
        if rand < 0.15:  # 15% no purchase
            return 0
        elif rand < 0.45:  # 30% basic frames
            return round(random.uniform(25, 75), 2)
        elif rand < 0.80:  # 35% mid-range
            return round(random.uniform(76, 150), 2)
        elif rand < 0.95:  # 15% premium
            return round(random.uniform(151, 300), 2)
        else:  # 5% luxury
            return round(random.uniform(301, 500), 2)
    
    @staticmethod
    def generate_patient_attributes(age):
        # Varifocal more common in 45+
        varifocal = age > 45 and random.random() < 0.6
        
        # Employment by age
        if age < 25:
            employed = random.random() < 0.5
        elif age < 65:
            employed = random.random() < 0.85
        else:
            employed = random.random() < 0.15
        

        benefits = random.random() < 0.35
        
        # driver
        if age < 18:
            driver = False
        elif age < 70:
            driver = random.random() < 0.80
        else:
            driver = random.random() < 0.60
        

        vdu = employed and random.random() < 0.70
        

        high_rx_prob = 0.15 + (age / 100 * 0.15)
        high_rx = random.random() < high_rx_prob
        
        # Days since last purchase
        days_lps = random.choice([
            random.randint(30, 180),   # Recent
            random.randint(181, 365),  # Annual
            random.randint(366, 730),  # Bi-annual
            random.randint(731, 1460), # Long-time
        ])
        
        return {
            'age': age,
            'days_lps': days_lps,
            'employed': 'Y' if employed else 'N',
            'benefits': 'Y' if benefits else 'N',
            'driver': 'Y' if driver else 'N',
            'vdu': 'Y' if vdu else 'N',
            'varifocal': 'Y' if varifocal else 'N',
            'high_rx': 'Y' if high_rx else 'N',
        }
    
    @classmethod
    def generate_past_csv(cls) -> Tuple[str, str]:

        today = datetime.now().date()
        output = io.StringIO()
        
        fieldnames = ['id', 'age', 'days_lps', 'employed', 'benefits', 'driver', 
                      'vdu', 'varifocal', 'high_rx', 'appointment_date', 'amount_spent']
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()
        
        patient_id = 1000
        
        for day_offset in range(cls.PAST_DAYS, 0, -1):
            appointment_date = today - timedelta(days=day_offset)

            for _ in range(cls.PATIENTS_PER_DAY):
                age = cls.generate_age()
                attrs = cls.generate_patient_attributes(age)
                amount_spent = cls.generate_purchase_amount()

                # Generate appointment time 9-5
                hour = random.randint(9, 17)
                minute = random.choice([0, 15, 30, 45])
                appointment_datetime = f"{appointment_date} {hour:02d}:{minute:02d}:00"

                writer.writerow({
                    'id': patient_id,
                    'age': age,
                    'days_lps': attrs['days_lps'],
                    'employed': attrs['employed'],
                    'benefits': attrs['benefits'],
                    'driver': attrs['driver'],
                    'vdu': attrs['vdu'],
                    'varifocal': attrs['varifocal'],
                    'high_rx': attrs['high_rx'],
                    'appointment_date': appointment_datetime,
                    'amount_spent': amount_spent,
                })

                patient_id += 1

        csv_content = output.getvalue()
        filename = f"demo_past_{today.strftime('%Y%m%d')}.csv"

        return csv_content, filename

    @classmethod
    def generate_upcoming_csv(cls) -> Tuple[str, str]:

        today = datetime.now().date()
        output = io.StringIO()

        fieldnames = ['id', 'age', 'days_lps', 'employed', 'benefits', 'driver',
                      'vdu', 'varifocal', 'high_rx', 'appointment_date']
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()

        patient_id = 5000

        for day_offset in range(cls.FUTURE_DAYS):
            appointment_date = today + timedelta(days=day_offset)


            for _ in range(cls.PATIENTS_PER_DAY):
                age = cls.generate_age()
                attrs = cls.generate_patient_attributes(age)


                hour = random.randint(9, 17)
                minute = random.choice([0, 15, 30, 45])
                appointment_datetime = f"{appointment_date} {hour:02d}:{minute:02d}:00"

                writer.writerow({
                    'id': patient_id,
                    'age': age,
                    'days_lps': attrs['days_lps'],
                    'employed': attrs['employed'],
                    'benefits': attrs['benefits'],
                    'driver': attrs['driver'],
                    'vdu': attrs['vdu'],
                    'varifocal': attrs['varifocal'],
                    'high_rx': attrs['high_rx'],
                    'appointment_date': appointment_datetime,
                })

                patient_id += 1

        csv_content = output.getvalue()
        filename = f"demo_upcoming_{today.strftime('%Y%m%d')}.csv"

        return csv_content, filename


# Convenience functions
def get_demo_past_csv():
    """Get past appointments CSV - returns (content, filename)"""
    return DemoCSVGenerator.generate_past_csv()


def get_demo_upcoming_csv():
    """Get upcoming appointments CSV - returns (content, filename)"""
    return DemoCSVGenerator.generate_upcoming_csv()
