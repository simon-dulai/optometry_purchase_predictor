import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
import numpy as np
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler

class Linear:
    def __init__(self):
        self.model = None
        self.scaler = None

    def prepare_lp(self):
        df = pd.read_csv("data/realistic_optometry_data_10000.csv", delimiter =  ",")
        df['Employed'] = df.Employed.apply(lambda x: 1 if x == 'Y' else 0)
        df['Benefits'] = df.Benefits.apply(lambda x: 0 if x == 'Y' else 1)
        df['Driver'] = df.Driver.apply(lambda x: 1 if x == 'Y' else 0)
        df['VDU'] = df.VDU.apply(lambda x: 1 if x == 'Y' else 0)
        df['Varifocal'] = df.Varifocal.apply(lambda x: 1 if x == 'Y' else 0)
        df['High_Rx'] = df.High_Rx.apply(lambda x: 1 if x == 'Y' else 0)
        x = df[['Age', 'Days_LPS', 'Employed', 'Benefits', 'Driver', 'VDU', 'Varifocal', 'High_Rx']]
        y = df['Spent']
        return x,y

    def linear_api_data(self, features):
        x_new = features
        return x_new

    def train_lp(self, x,y):
        x_train, x_test, y_train, y_test = train_test_split(x, y, test_size=0.2, random_state=42)
        scaler = StandardScaler()
        x_train_scaled = scaler.fit_transform(x_train)
        x_test_scaled = scaler.transform(x_test)
        lr = LinearRegression()
        lr.fit(x_train_scaled, y_train)
        self.model = lr
        self.scaler = scaler
        return self.model, scaler

    def predict_spending(self, features, scaler):
       
        features_scaled = scaler.transform([features]) 
        prediction = self.model.predict(features_scaled)[0]
        return prediction
